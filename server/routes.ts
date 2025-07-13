import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateContentSchema, generateTopicSchema } from "@shared/schema";
import OpenAI from "openai";

// Extend Express Request type to include session
declare module 'express-session' {
  interface SessionData {
    id: string;
  }
}

const DAILY_LIMIT = 10;

// Check if OpenAI API key is available
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR;
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.post("/api/generate-content", async (req, res) => {
    try {
      // Check if OpenAI is available
      if (!openai) {
        res.status(503).json({ 
          message: "OpenAI API가 설정되지 않았습니다. 잠시 후 다시 시도해주세요." 
        });
        return;
      }

      const validatedData = generateContentSchema.parse(req.body);
      const { topic, contentType, tone = 'casual' } = validatedData;

      // Get or create session ID
      if (!req.session.id) {
        req.session.id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      const sessionId = req.session.id;

      // Check daily usage limit
      const dailyUsage = await storage.getDailyUsageCount(sessionId);
      if (dailyUsage >= DAILY_LIMIT) {
        res.status(429).json({ 
          message: `일일 생성 한도 ${DAILY_LIMIT}개를 초과했습니다. 내일 다시 시도해주세요.`,
          remainingCount: 0,
          maxDaily: DAILY_LIMIT
        });
        return;
      }

      // Create content request record
      const contentRequest = await storage.createContentRequest({
        topic,
        contentType,
        sessionId,
      });

      // Define system prompts for each content type
      const toneInstruction = tone === 'formal' ? '존댓말(습니다, 세요)' : '반말(야, 어, 지)';
      
      const systemPrompts = {
        profile: `너는 전환율을 높이는 SNS 프로필 카피라이팅 전문가야.

사용자가 입력한 '주제'를 바탕으로 전환형 Threads 또는 인스타그램 프로필 문구를 작성해줘.

다음 예시와 같은 형식으로 구성해:

💡 '나답게 팔리는 사람'이 정말 될 수 있을까?
👤 퍼스널 브랜딩 & 글쓰기 코치, 1인 창업자 전환 전문
📈 코칭생 200명+, 첫 글 올리고 하루 만에 100만 뷰 경험
📌 나만의 색을 찾고 싶은 분, 위 링크에서 시작하세요

각 줄 앞에 관련된 이모티콘 1개씩 배치하고:
• 첫 줄: 호기심 유발하는 질문이나 임팩트 문장
• 두 번째 줄: 전문성과 정체성을 보여주는 설명
• 세 번째 줄: 구체적인 수치나 경험 기반 증거
• 네 번째 줄: 명확한 행동 유도 문장

자연스럽고 사람 냄새 나는 문체로, 친근하면서도 전문적인 톤으로 작성해줘.`,

        review: `너는 사람들에게 신뢰를 주고 전환을 유도하는 SNS 후기 글쓰기 전문가야.

사용자가 입력한 '주제'를 바탕으로, 아래 스토리 구조에 맞춰 후기성 글을 작성해줘:

1. 처음엔 어떤 고민이나 망설임이 있었는지
2. 어떤 계기로 도전하게 되었는지
3. 경험 중 구체적인 순간 또는 변화된 결과
4. 나와 비슷한 사람들에게 공감과 권유 메시지

총 600자 내외로, 너무 광고스럽지 않게 진심이 느껴지도록 써줘.
말투는 ${toneInstruction}를 사용해서 작성해.`,

        info: `너는 팔로워를 늘릴 수 있는 SNS 정보성 글 콘텐츠 제작 전문가야.

사용자가 입력한 '주제'를 바탕으로, Threads나 인스타에 적합한 정보형 글을 아래 구조로 작성해줜:

1. 후킹 문장 1줄 (공감 or 궁금증 유발)
2. 핵심 정보나 팁 5가지 (리스트 형식, 간결하고 유익하게)
3. 마무리: 요약 + 댓글을 유도하는 질문 또는 저장 유도 문장

말투는 ${toneInstruction}를 사용해서 작성해. 너무 딱딱하지 않고, 친근하면서 실용적으로 작성해줘.

⚠️ 절대 금지사항: 
- ** (별표 두 개) 절대 사용 금지
- * (별표 하나) 절대 사용 금지  
- __ (밑줄 두 개) 절대 사용 금지
- _ (밑줄 하나) 절대 사용 금지
- "" (큰따옴표) 절대 사용 금지
- '' (작은따옴표) 절대 사용 금지

반드시 순수한 텍스트로만 작성하고, 강조가 필요할 때는 이모티콘이나 숫자만 사용해.`
      };

      // Generate content using OpenAI
      const systemPrompt = systemPrompts[contentType as keyof typeof systemPrompts];
      
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `주제: ${topic}` }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const generatedContent = response.choices[0].message.content || "";
      
      // Update the content request with generated content
      await storage.updateContentRequest(contentRequest.id, generatedContent);

      // Get updated usage count after generation
      const updatedUsage = await storage.getDailyUsageCount(sessionId);
      
      res.json({
        id: contentRequest.id,
        content: generatedContent,
        contentType,
        topic,
        remainingCount: DAILY_LIMIT - updatedUsage,
        maxDaily: DAILY_LIMIT
      });

    } catch (error: any) {
      console.error("Content generation error:", error);
      
      if (error.name === "ZodError") {
        res.status(400).json({ 
          message: "입력 데이터가 올바르지 않습니다",
          errors: error.errors 
        });
        return;
      }

      if (error.code === "insufficient_quota" || error.code === "invalid_api_key") {
        res.status(503).json({ 
          message: "OpenAI API 설정을 확인해주세요. API 키가 올바른지, 사용 한도가 남아있는지 확인하세요." 
        });
        return;
      }

      res.status(500).json({ 
        message: "콘텐츠 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." 
      });
    }
  });

  app.post("/api/generate-topics", async (req, res) => {
    try {
      // Check if OpenAI is available
      if (!openai) {
        res.status(503).json({ 
          message: "OpenAI API가 설정되지 않았습니다. 잠시 후 다시 시도해주세요." 
        });
        return;
      }

      const validatedData = generateTopicSchema.parse(req.body);
      const { contentType, industry = "" } = validatedData;

      // Get or create session ID
      if (!req.session.id) {
        req.session.id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      const sessionId = req.session.id;

      // Check daily usage limit (topic generation also counts toward limit)
      const dailyUsage = await storage.getDailyUsageCount(sessionId);
      if (dailyUsage >= DAILY_LIMIT) {
        res.status(429).json({ 
          message: `일일 생성 한도 ${DAILY_LIMIT}개를 초과했습니다. 내일 다시 시도해주세요.`,
          remainingCount: 0,
          maxDaily: DAILY_LIMIT
        });
        return;
      }

      // Define topic generation prompts for each content type
      const topicPrompts = {
        profile: `프로필 문구에 적합한 주제 5개를 생성해줘.

${industry ? `입력된 키워드/관심사: "${industry}"` : '일반적인 주제로'}

${industry ? 
  `위 키워드와 연관된 다양한 프로필 주제를 생성해줘:
- ${industry}와 관련된 전문성을 보여주는 주제
- ${industry} 분야의 문제 해결형 주제  
- ${industry}에서의 성장/변화 스토리 주제
- ${industry} 관련 라이프스타일이나 철학 주제` :
  `다음과 같은 다양한 유형의 주제를 포함해서:
- 전문성을 보여주는 주제 (예: 마케팅 전문가, 개발자, 디자이너 등)
- 문제 해결형 주제 (예: 시간 관리, 업무 효율, 창업 등)
- 성장/변화 스토리 주제 (예: 퇴사 후 창업, 부업에서 본업으로 등)
- 라이프스타일 주제 (예: 미니멀 라이프, 건강 관리 등)`
}

각 주제는 간결하고 구체적으로 작성해줘. 번호나 불릿 없이 한 줄씩만 작성해.`,

        review: `후기성 글에 적합한 주제 5개를 생성해줘.

${industry ? `입력된 키워드/관심사: "${industry}"` : '일반적인 주제로'}

${industry ? 
  `위 키워드와 연관된 다양한 후기 주제를 생성해줘:
- ${industry} 관련 교육/강의 수강 후기
- ${industry} 분야의 제품/서비스 사용 후기
- ${industry}와 관련된 도전/변화 경험담
- ${industry} 관련 투자/부업 경험담` :
  `다음과 같은 다양한 경험담 주제를 포함해서:
- 교육/강의 수강 후기 (예: 온라인 강의, 부트캠프, 워크샵 등)
- 제품/서비스 사용 후기 (예: 앱, 도구, 프로그램 등)
- 도전/변화 경험담 (예: 새로운 습관, 운동, 다이어트 등)
- 투자/부업 경험담 (예: 주식, 부동산, 사이드 프로젝트 등)`
}

각 주제는 구체적이고 공감 가능한 내용으로 작성해줘. 번호나 불릿 없이 한 줄씩만 작성해.`,

        info: `정보성 글에 적합한 주제 5개를 생성해줘.

${industry ? `입력된 키워드/관심사: "${industry}"` : '일반적인 주제로'}

${industry ? 
  `위 키워드와 연관된 다양한 정보성 주제를 생성해줘:
- ${industry} 관련 How-to 가이드 
- ${industry} 분야의 팁과 노하우
- ${industry} 관련 도구/리소스 추천
- ${industry} 분야의 트렌드/인사이트` :
  `다음과 같은 유용한 정보 주제를 포함해서:
- How-to 가이드 (예: 효율적인 방법, 단계별 과정 등)
- 팁과 노하우 (예: 시간 절약, 비용 절약, 생산성 향상 등)
- 도구/리소스 추천 (예: 앱, 웹사이트, 서비스 등)
- 트렌드/인사이트 (예: 업계 동향, 새로운 기법 등)`
}

각 주제는 실용적이고 도움이 되는 내용으로 작성해줘. 번호나 불릿 없이 한 줄씩만 작성해.`
      };

      // Create content request record for topic generation
      const contentRequest = await storage.createContentRequest({
        topic: `Topic generation for ${contentType}`,
        contentType: 'info', // Use a generic type for topic generation
        sessionId,
      });

      const prompt = topicPrompts[contentType as keyof typeof topicPrompts];

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: "주제 5개를 생성해줘." }
        ],
        temperature: 0.8,
        max_tokens: 500,
      });

      const generatedTopics = response.choices[0].message.content || "";
      const topicsArray = generatedTopics.split('\n').filter(topic => topic.trim().length > 0);

      // Update the content request with generated topics
      await storage.updateContentRequest(contentRequest.id, generatedTopics);

      // Get updated usage count after generation
      const updatedUsage = await storage.getDailyUsageCount(sessionId);

      res.json({
        topics: topicsArray,
        contentType,
        remainingCount: DAILY_LIMIT - updatedUsage,
        maxDaily: DAILY_LIMIT
      });

    } catch (error: any) {
      console.error("Topic generation error:", error);
      
      if (error.name === "ZodError") {
        res.status(400).json({ 
          message: "입력 데이터가 올바르지 않습니다",
          errors: error.errors 
        });
        return;
      }

      if (error.code === "insufficient_quota" || error.code === "invalid_api_key") {
        res.status(503).json({ 
          message: "OpenAI API 설정을 확인해주세요." 
        });
        return;
      }

      res.status(500).json({ 
        message: "주제 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." 
      });
    }
  });

  // Get current usage status
  app.get("/api/usage-status", async (req, res) => {
    try {
      // Get or create session ID
      if (!req.session.id) {
        req.session.id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      const sessionId = req.session.id;

      const dailyUsage = await storage.getDailyUsageCount(sessionId);
      
      res.json({
        usedCount: dailyUsage,
        remainingCount: DAILY_LIMIT - dailyUsage,
        maxDaily: DAILY_LIMIT,
        limitReached: dailyUsage >= DAILY_LIMIT
      });
    } catch (error: any) {
      console.error("Usage status error:", error);
      res.status(500).json({ 
        message: "사용량 정보를 가져오는 중 오류가 발생했습니다." 
      });
    }
  });

  // Create share link for content
  app.post("/api/share/:id", async (req, res) => {
    try {
      const contentId = parseInt(req.params.id);
      if (!contentId || isNaN(contentId)) {
        res.status(400).json({ message: "유효하지 않은 콘텐츠 ID입니다." });
        return;
      }

      const shareId = await storage.createShareableContent(contentId);
      const shareUrl = `${req.protocol}://${req.get('host')}/share/${shareId}`;

      res.json({ shareUrl, shareId });
    } catch (error) {
      console.error("Share creation error:", error);
      res.status(500).json({ message: "공유 링크 생성에 실패했습니다." });
    }
  });

  // Get shared content
  app.get("/api/shared/:shareId", async (req, res) => {
    try {
      const { shareId } = req.params;
      const sharedContent = await storage.getSharedContent(shareId);

      if (!sharedContent) {
        res.status(404).json({ message: "공유된 콘텐츠를 찾을 수 없습니다." });
        return;
      }

      res.json({
        topic: sharedContent.topic,
        contentType: sharedContent.contentType,
        content: sharedContent.generatedContent,
        createdAt: sharedContent.createdAt
      });
    } catch (error) {
      console.error("Shared content error:", error);
      res.status(500).json({ message: "공유된 콘텐츠를 불러오는데 실패했습니다." });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
