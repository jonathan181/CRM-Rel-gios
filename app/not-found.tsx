import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#e5e1e4] flex items-center justify-center p-6">
      <div className="bg-[#131315] border border-[#27272a] rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <AlertTriangle className="w-12 h-12 text-[#ffd165] mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Página Não Encontrada</h2>
        <p className="text-[#9b8f79] text-xs mb-6">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ffd165] text-[#131315] font-bold text-xs rounded-xl hover:bg-[#e5bc53] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Início
        </Link>
      </div>
    </div>
  );
}
