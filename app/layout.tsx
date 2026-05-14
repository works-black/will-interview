import type { Metadata } from 'next';
import './globals.css';
import { InterviewProvider } from '@/context/InterviewContext';

export const metadata: Metadata = {
  title: 'WILL面談ツール',
  description: 'Will B プログラム 面談サポートツール',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <InterviewProvider>{children}</InterviewProvider>
      </body>
    </html>
  );
}
