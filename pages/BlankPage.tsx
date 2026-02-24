import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Container } from '../components/ui/Container';

export const BlankPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>BLANK - 행사어때</title>
        <meta name="description" content="새로운 기능 준비중입니다." />
      </Helmet>
      <div className="pt-24 pb-16 bg-gray-50 min-h-screen">
        <Container>
          <div className="text-center py-20 px-6 max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">BLANK</h1>
            <p className="text-gray-500">페이지 준비중입니다.</p>
          </div>
        </Container>
      </div>
    </>
  );
};
