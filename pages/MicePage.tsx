import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Container } from '../components/ui/Container';

export const MicePage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>MICE 회원사 - 행사어때</title>
        <meta name="description" content="행사어때의 MICE 회원사를 소개합니다." />
      </Helmet>
      <div className="pt-24 pb-16 bg-gray-50 min-h-screen">
        <Container>
          <div className="text-center py-20 px-6 max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">MICE 회원사</h1>
            <p className="text-gray-500">MICE 회원사 준비중입니다.</p>
          </div>
        </Container>
      </div>
    </>
  );
};
