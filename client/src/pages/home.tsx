import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Star, Info, Copy, Loader2, Edit, Lightbulb, Share2, AlertCircle } from "lucide-react";

interface GenerateContentRequest {
  topic: string;
  contentType: 'profile' | 'review' | 'info';
  tone?: 'formal' | 'casual';
}

interface GenerateContentResponse {
  id: number;
  content: string;
  contentType: string;
  topic: string;
}

interface GenerateTopicRequest {
  contentType: 'profile' | 'review' | 'info';
  industry?: string;
}

interface GenerateTopicResponse {
  topics: string[];
  contentType: string;
  remainingCount?: number;
  maxDaily?: number;
}

interface UsageStatus {
  usedCount: number;
  remainingCount: number;
  maxDaily: number;
  limitReached: boolean;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'profile' | 'review' | 'info'>('profile');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [profileTopic, setProfileTopic] = useState("");
  const [reviewTopic, setReviewTopic] = useState("");
  const [infoTopic, setInfoTopic] = useState("");
  const [reviewTone, setReviewTone] = useState<'formal' | 'casual'>('casual');
  const [infoTone, setInfoTone] = useState<'formal' | 'casual'>('casual');
  const [profileContent, setProfileContent] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [infoContent, setInfoContent] = useState("");
  const [contentIds, setContentIds] = useState({
    profile: null as number | null,
    review: null as number | null,
    info: null as number | null
  });
  const [loadingStates, setLoadingStates] = useState({
    profile: false,
    review: false,
    info: false
  });
  const [topicSuggestions, setTopicSuggestions] = useState<{
    profile: string[];
    review: string[];
    info: string[];
  }>({
    profile: [],
    review: [],
    info: []
  });
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null);
  
  const { toast } = useToast();

  // Fetch usage status on component mount
  const { data: usageData } = useQuery({
    queryKey: ['/api/usage-status'],
    refetchInterval: 60000, // Refetch every minute
  });

  // Update usage status when data changes
  useEffect(() => {
    if (usageData) {
      setUsageStatus(usageData);
    }
  }, [usageData]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const generateContentMutation = useMutation({
    mutationFn: async (data: GenerateContentRequest): Promise<GenerateContentResponse> => {
      const response = await apiRequest("POST", "/api/generate-content", data);
      return response.json();
    },
    onSuccess: (data) => {
      switch (data.contentType) {
        case 'profile':
          setProfileContent(data.content);
          setContentIds(prev => ({ ...prev, profile: data.id }));
          break;
        case 'review':
          setReviewContent(data.content);
          setContentIds(prev => ({ ...prev, review: data.id }));
          break;
        case 'info':
          setInfoContent(data.content);
          setContentIds(prev => ({ ...prev, info: data.id }));
          break;
      }
      setLoadingStates(prev => ({ ...prev, [data.contentType]: false }));
      toast({
        title: "생성 완료!",
        description: "콘텐츠가 성공적으로 생성되었습니다.",
      });
    },
    onError: (error: any) => {
      console.error("Generation error:", error);
      setLoadingStates({ profile: false, review: false, info: false });
      
      let errorMessage = "콘텐츠 생성 중 오류가 발생했습니다.";
      let errorTitle = "생성 실패";
      
      if (error.message?.includes("OpenAI API")) {
        errorTitle = "서비스 일시 중단";
        errorMessage = "현재 AI 서비스가 일시적으로 중단되었습니다. 잠시 후 다시 시도해주세요.";
      } else if (error.message?.includes("일일 생성 한도")) {
        errorTitle = "하루 사용량 초과";
        errorMessage = "오늘 하루 사용량 10개를 모두 사용했습니다. 내일 다시 이용해주세요.";
      }
      
      toast({
        variant: "destructive",
        title: errorTitle,
        description: errorMessage,
      });
    },
  });

  const generateTopicMutation = useMutation({
    mutationFn: async (data: GenerateTopicRequest): Promise<GenerateTopicResponse> => {
      const response = await apiRequest("POST", "/api/generate-topics", data);
      return response.json();
    },
    onSuccess: (data) => {
      setTopicSuggestions(prev => ({
        ...prev,
        [data.contentType]: data.topics
      }));
      setLoadingTopics(false);
      toast({
        title: "주제 생성 완료!",
        description: "새로운 주제 아이디어가 생성되었습니다.",
      });
    },
    onError: (error: any) => {
      console.error("Topic generation error:", error);
      setLoadingTopics(false);
      
      let errorMessage = "주제 생성 중 오류가 발생했습니다.";
      let errorTitle = "주제 생성 실패";
      
      if (error.message?.includes("OpenAI API")) {
        errorTitle = "서비스 일시 중단";
        errorMessage = "현재 AI 서비스가 일시적으로 중단되었습니다. 잠시 후 다시 시도해주세요.";
      } else if (error.message?.includes("일일 생성 한도")) {
        errorTitle = "하루 사용량 초과";
        errorMessage = "오늘 하루 사용량을 모두 사용했습니다. 내일 다시 이용해주세요.";
      }
      
      toast({
        variant: "destructive",
        title: errorTitle,
        description: errorMessage,
      });
    },
  });

  const handleGenerateTopics = (contentType: 'profile' | 'review' | 'info') => {
    setLoadingTopics(true);
    
    // Get the current topic input as keyword context
    let currentInput = "";
    switch (contentType) {
      case 'profile':
        currentInput = profileTopic;
        break;
      case 'review':
        currentInput = reviewTopic;
        break;
      case 'info':
        currentInput = infoTopic;
        break;
    }
    
    generateTopicMutation.mutate({ 
      contentType, 
      industry: currentInput.trim() || undefined 
    });
  };

  const handleSelectTopic = (topic: string) => {
    switch (activeTab) {
      case 'profile':
        setProfileTopic(topic);
        break;
      case 'review':
        setReviewTopic(topic);
        break;
      case 'info':
        setInfoTopic(topic);
        break;
    }
  };

  const handleGenerate = (contentType: 'profile' | 'review' | 'info') => {
    let currentTopic = "";
    switch (contentType) {
      case 'profile':
        currentTopic = profileTopic;
        break;
      case 'review':
        currentTopic = reviewTopic;
        break;
      case 'info':
        currentTopic = infoTopic;
        break;
    }

    if (!currentTopic.trim()) {
      toast({
        variant: "destructive",
        title: "주제를 입력해주세요",
        description: "콘텐츠를 생성하려면 주제를 입력해야 합니다.",
      });
      return;
    }

    setLoadingStates(prev => ({ ...prev, [contentType]: true }));
    
    const requestData: GenerateContentRequest = { 
      topic: currentTopic.trim(), 
      contentType 
    };
    
    // Add tone for review and info content types
    if (contentType === 'review') {
      requestData.tone = reviewTone;
    } else if (contentType === 'info') {
      requestData.tone = infoTone;
    }
    
    generateContentMutation.mutate(requestData);
  };

  const copyToClipboard = async (content: string) => {
    if (!content) {
      toast({
        variant: "destructive",
        title: "복사할 내용이 없습니다",
        description: "먼저 콘텐츠를 생성해주세요.",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "복사 완료!",
        description: "클립보드에 복사되었습니다.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "복사 실패",
        description: "클립보드 복사 중 오류가 발생했습니다.",
      });
    }
  };

  const shareContent = async (contentType: 'profile' | 'review' | 'info') => {
    const contentId = contentIds[contentType];
    if (!contentId) {
      toast({
        variant: "destructive",
        title: "공유할 콘텐츠가 없습니다",
        description: "먼저 콘텐츠를 생성해주세요.",
      });
      return;
    }

    try {
      const response = await apiRequest("POST", `/api/share/${contentId}`, {});
      const data = await response.json();
      
      await navigator.clipboard.writeText(data.shareUrl);
      toast({
        title: "공유 링크 복사 완료!",
        description: "공유 링크가 클립보드에 복사되었습니다.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "공유 링크 생성 실패",
        description: "공유 링크 생성 중 오류가 발생했습니다.",
      });
    }
  };

  const getCharCount = (content: string) => content.length;

  const EmptyState = ({ type }: { type: string }) => (
    <div className="text-slate-400 text-center py-12">
      <Edit className="mx-auto h-10 w-10 mb-3" />
      <p>주제를 입력하고 '{type} 생성' 버튼을 클릭하세요</p>
    </div>
  );

  const getCurrentData = () => {
    switch (activeTab) {
      case 'profile':
        return {
          topic: profileTopic,
          setTopic: setProfileTopic,
          content: profileContent,
          loading: loadingStates.profile,
          placeholder: "예: 퇴사 후 1인 창업으로 퍼스널 브랜딩 시작한 사람의 프로필",
          title: "프로필 문구 생성",
          description: "전환율을 높이는 SNS 프로필 문구를 생성합니다. 문제 제기 → 정체성 소개 → 증거 제시 → CTA 순서로 구성됩니다.",
          icon: User,
          bgColor: "bg-primary/5",
          textColor: "text-primary",
          borderColor: "border-primary/10",
          buttonColor: "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
        };
      case 'review':
        return {
          topic: reviewTopic,
          setTopic: setReviewTopic,
          content: reviewContent,
          loading: loadingStates.review,
          placeholder: "예: 스레드 글쓰기 교육을 수강한 후기",
          title: "후기성 글 생성",
          description: "신뢰도를 높이는 경험담 스타일의 글을 생성합니다. 고민 → 계기 → 변화 → 권유 구조로 작성됩니다.",
          icon: Star,
          bgColor: "bg-emerald-50",
          textColor: "text-emerald-700",
          borderColor: "border-emerald-100",
          buttonColor: "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
        };
      case 'info':
        return {
          topic: infoTopic,
          setTopic: setInfoTopic,
          content: infoContent,
          loading: loadingStates.info,
          placeholder: "예: 스레드 글을 더 많은 사람에게 노출시키는 방법",
          title: "정보성 글 생성",
          description: "팔로워를 늘리는 유익한 정보글을 생성합니다. 후킹 문장 → 핵심 팁 5가지 → 댓글 유도 형식으로 구성됩니다.",
          icon: Info,
          bgColor: "bg-purple-50",
          textColor: "text-purple-700",
          borderColor: "border-purple-100",
          buttonColor: "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
        };
    }
  };

  const currentData = getCurrentData();
  const Icon = currentData.icon;

  return (
    <div className="font-inter bg-slate-50 text-slate-900 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">SNS 콘텐츠 생성기</h1>
            <p className="text-lg text-slate-600">전환율을 높이는 프로필과 글쓰기를 위한 AI 도구</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Offline Warning */}
        {!isOnline && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800 font-medium">인터넷 연결이 끊어졌습니다</span>
              <span className="text-red-600 ml-2">연결을 확인한 후 다시 시도해주세요.</span>
            </div>
          </div>
        )}

        {/* Usage Status */}
        {usageStatus && (
          <div className="mb-6">
            <Card className={`${usageStatus.limitReached ? 'border-red-200 bg-red-50' : 'border-slate-200'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${usageStatus.limitReached ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <span className="text-sm font-medium text-slate-700">
                      일일 생성 현황: {usageStatus.usedCount}/{usageStatus.maxDaily}회 사용
                    </span>
                  </div>
                  <div className="text-sm text-slate-500">
                    {usageStatus.limitReached ? (
                      <span className="text-red-600 font-medium">한도 초과 - 내일 다시 이용 가능</span>
                    ) : (
                      <span>남은 횟수: {usageStatus.remainingCount}회</span>
                    )}
                  </div>
                </div>
                {!usageStatus.limitReached && (
                  <div className="mt-2">
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(usageStatus.usedCount / usageStatus.maxDaily) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === 'profile'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>프로필 생성</span>
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === 'review'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Star className="w-4 h-4" />
              <span>후기성 글 생성</span>
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === 'info'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>정보성 글 생성</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-4">{currentData.title}</h3>
            <p className="text-slate-600 mb-6">{currentData.description}</p>
            
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="relative">
                    <Textarea
                      rows={4}
                      value={currentData.topic}
                      onChange={(e) => currentData.setTopic(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary resize-none text-base"
                      placeholder={currentData.placeholder}
                      maxLength={500}
                    />
                    <div className="absolute bottom-3 right-3 text-sm text-slate-400">
                      <span>{getCharCount(currentData.topic)}</span>/500
                    </div>
                  </div>
                  
                  {/* Tone Selection for Review and Info tabs only */}
                  {(activeTab === 'review' || activeTab === 'info') && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">말투 선택</Label>
                      <Select
                        value={activeTab === 'review' ? reviewTone : infoTone}
                        onValueChange={(value: 'formal' | 'casual') => {
                          if (activeTab === 'review') {
                            setReviewTone(value);
                          } else if (activeTab === 'info') {
                            setInfoTone(value);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="말투를 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="casual">반말 (야, 어, 지)</SelectItem>
                          <SelectItem value="formal">존댓말 (습니다, 세요)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {/* Topic Generation Button */}
                  <div className="space-y-2">
                    <div className="text-xs text-slate-500">
                      💡 팁: 위에 키워드를 입력한 후 '주제 추천받기'를 누르면 관련된 주제를 추천해드려요
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleGenerateTopics(activeTab)}
                        disabled={loadingTopics || (usageStatus?.limitReached ?? false) || !isOnline}
                        variant="outline"
                        className="flex-1"
                      >
                        {loadingTopics ? (
                          <div className="flex items-center justify-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>주제 생성 중...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <Lightbulb className="h-4 w-4" />
                            <span>주제 추천받기</span>
                          </div>
                        )}
                      </Button>
                      <Button
                      onClick={() => handleGenerate(activeTab)}
                      disabled={currentData.loading || !currentData.topic.trim() || (usageStatus?.limitReached ?? false) || !isOnline}
                      className={`flex-1 py-3 rounded-xl text-white font-semibold transition-all duration-200 ${currentData.buttonColor}`}
                    >
                      {currentData.loading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>생성 중...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <Icon className="h-5 w-5" />
                          <span>{currentData.title}</span>
                        </div>
                      )}
                    </Button>
                    </div>
                  </div>
                  
                  {/* Topic Suggestions */}
                  {topicSuggestions[activeTab].length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">추천 주제 (클릭하여 선택)</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {topicSuggestions[activeTab].map((topic, index) => (
                          <Button
                            key={index}
                            onClick={() => handleSelectTopic(topic)}
                            variant="ghost"
                            className="h-auto p-3 text-left text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg whitespace-normal"
                          >
                            {topic}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Output Section */}
          <div>
            <Card className="overflow-hidden">
              <CardHeader className={`${currentData.bgColor} border-b ${currentData.borderColor}`}>
                <CardTitle className={`text-lg font-semibold ${currentData.textColor} flex items-center`}>
                  <Icon className="w-5 h-5 mr-2" />
                  생성된 {activeTab === 'profile' ? '프로필 문구' : activeTab === 'review' ? '후기성 글' : '정보성 글'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="min-h-[300px] mb-4">
                  {currentData.content ? (
                    <div className="text-slate-900 leading-relaxed whitespace-pre-line text-sm">
                      {currentData.content}
                    </div>
                  ) : (
                    <EmptyState type={activeTab === 'profile' ? '프로필' : activeTab === 'review' ? '후기성 글' : '정보성 글'} />
                  )}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-sm text-slate-500">{getCharCount(currentData.content)}자</span>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => copyToClipboard(currentData.content)}
                      disabled={!currentData.content}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Copy className="w-4 h-4" />
                      <span>복사하기</span>
                    </Button>
                    <Button
                      onClick={() => shareContent(activeTab)}
                      disabled={!currentData.content || !contentIds[activeTab]}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>공유하기</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Feature Info */}
        <Card className="mt-12">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">기능 안내</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">프로필 생성기</h3>
                <p className="text-slate-600 text-sm leading-relaxed">문제 제기 → 정체성 소개 → 증거 제시 → CTA 순서로 전환율 높이는 프로필 문구를 생성합니다.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">후기성 글 생성기</h3>
                <p className="text-slate-600 text-sm leading-relaxed">고민 → 계기 → 변화 → 권유 구조로 신뢰감을 주는 경험담 스타일의 글을 작성합니다.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Info className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">정보성 글 생성기</h3>
                <p className="text-slate-600 text-sm leading-relaxed">후킹 문장 → 핵심 팁 5가지 → 댓글 유도 형식으로 팔로워 증가에 도움이 되는 유익한 글을 생성합니다.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}