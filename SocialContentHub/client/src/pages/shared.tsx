import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Star, Info, Copy, ArrowLeft, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SharedContent {
  topic: string;
  contentType: 'profile' | 'review' | 'info';
  content: string;
  createdAt: string;
}

export default function SharedContent() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const shareId = location.split('/')[2]; // Extract shareId from /share/:shareId

  const { data: sharedContent, isLoading, error } = useQuery({
    queryKey: ['/api/shared', shareId],
    queryFn: async (): Promise<SharedContent> => {
      const response = await apiRequest("GET", `/api/shared/${shareId}`, {});
      return response.json();
    },
    enabled: !!shareId,
  });

  const copyToClipboard = async (content: string) => {
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

  const getContentTypeInfo = (contentType: string) => {
    switch (contentType) {
      case 'profile':
        return {
          title: "프로필 문구",
          icon: User,
          bgColor: "bg-primary/5",
          textColor: "text-primary",
          borderColor: "border-primary/10",
        };
      case 'review':
        return {
          title: "후기성 글",
          icon: Star,
          bgColor: "bg-emerald-50",
          textColor: "text-emerald-700",
          borderColor: "border-emerald-100",
        };
      case 'info':
        return {
          title: "정보성 글",
          icon: Info,
          bgColor: "bg-purple-50",
          textColor: "text-purple-700",
          borderColor: "border-purple-100",
        };
      default:
        return {
          title: "콘텐츠",
          icon: Info,
          bgColor: "bg-slate-50",
          textColor: "text-slate-700",
          borderColor: "border-slate-100",
        };
    }
  };

  if (isLoading) {
    return (
      <div className="font-inter bg-slate-50 text-slate-900 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-600">공유된 콘텐츠를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !sharedContent) {
    return (
      <div className="font-inter bg-slate-50 text-slate-900 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">콘텐츠를 찾을 수 없습니다</h1>
            <p className="text-slate-600 mb-8">요청하신 공유 콘텐츠가 존재하지 않거나 삭제되었습니다.</p>
            <Button onClick={() => navigate('/')} className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>홈으로 돌아가기</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const contentInfo = getContentTypeInfo(sharedContent.contentType);
  const Icon = contentInfo.icon;

  return (
    <div className="font-inter bg-slate-50 text-slate-900 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">공유된 콘텐츠</h1>
              <p className="text-slate-600">SNS 콘텐츠 생성기로 만들어진 글</p>
            </div>
            <Button 
              onClick={() => navigate('/')} 
              variant="outline"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>홈으로</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Topic Info */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-1">주제</h2>
                <p className="text-slate-700">{sharedContent.topic}</p>
              </div>
              <div className="flex items-center text-sm text-slate-500">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(sharedContent.createdAt).toLocaleDateString('ko-KR')}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <Card className="overflow-hidden">
          <CardHeader className={`${contentInfo.bgColor} border-b ${contentInfo.borderColor}`}>
            <CardTitle className={`text-lg font-semibold ${contentInfo.textColor} flex items-center`}>
              <Icon className="w-5 h-5 mr-2" />
              {contentInfo.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="min-h-[300px] mb-4">
              <div className="text-slate-900 leading-relaxed whitespace-pre-line text-sm">
                {sharedContent.content}
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-sm text-slate-500">{sharedContent.content.length}자</span>
              <Button
                onClick={() => copyToClipboard(sharedContent.content)}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                <span>복사하기</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center mt-12">
          <h3 className="text-xl font-semibold text-slate-900 mb-4">나만의 콘텐츠도 만들어보세요!</h3>
          <p className="text-slate-600 mb-6">
            전환율을 높이는 프로필 문구부터 팔로워를 늘리는 정보성 글까지<br />
            AI가 도와드립니다.
          </p>
          <Button 
            onClick={() => navigate('/')}
            size="lg"
            className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
          >
            콘텐츠 생성해보기
          </Button>
        </div>
      </main>
    </div>
  );
}