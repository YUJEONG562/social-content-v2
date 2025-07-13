import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { useLocation } from "wouter";

interface ErrorPageProps {
  title?: string;
  message?: string;
  showRefresh?: boolean;
}

export default function ErrorPage({ 
  title = "서비스 일시 중단", 
  message = "현재 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
  showRefresh = true 
}: ErrorPageProps) {
  const [, navigate] = useLocation();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="font-inter bg-slate-50 text-slate-900 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="text-center">
          <CardHeader className="pb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">{title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-slate-600 leading-relaxed">{message}</p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {showRefresh && (
                <Button 
                  onClick={handleRefresh}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>다시 시도</span>
                </Button>
              )}
              <Button 
                onClick={() => navigate('/')}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Home className="w-4 h-4" />
                <span>홈으로 이동</span>
              </Button>
            </div>

            <div className="pt-6 border-t border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">문제가 지속되나요?</h3>
              <ul className="text-sm text-slate-600 space-y-2">
                <li>• 브라우저를 새로고침해 보세요</li>
                <li>• 다른 브라우저에서 시도해 보세요</li>
                <li>• 인터넷 연결을 확인해 보세요</li>
                <li>• 잠시 후 다시 접속해 보세요</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}