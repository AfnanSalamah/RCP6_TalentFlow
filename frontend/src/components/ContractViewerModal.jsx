import { Download, Minus, Plus, X } from 'lucide-react';

export default function ContractViewerModal({ contract, onClose }) {
  const zoom = contract.zoom || 1;
  const setZoom = contract.setZoom || (() => {});
  const content = contract.content || contract.terms || contract.body || 'No contract content available.';

  function downloadPdf() {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${contract.title || 'Contract'}</title></head><body><pre style="font-family:Segoe UI,Arial,sans-serif;white-space:pre-wrap;line-height:1.65">${content.replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]))}</pre></body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,29,57,.45)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{contract.title || 'Contract Viewer'}</h2>
            <p className="text-sm text-slate-500">{contract.candidateName || contract.candidate || 'Candidate'} - {contract.roleTitle || contract.role || 'Job position'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50" onClick={() => setZoom(Math.max(.75, zoom - .1))} title="Zoom out"><Minus size={16} /></button>
            <span className="text-xs font-bold text-slate-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50" onClick={() => setZoom(Math.min(1.5, zoom + .1))} title="Zoom in"><Plus size={16} /></button>
            <button className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50" onClick={downloadPdf} title="Download PDF"><Download size={16} /></button>
            <button className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50" onClick={onClose} title="Close"><X size={16} /></button>
          </div>
        </div>
        <div className="grid md:grid-cols-[260px_1fr] min-h-0">
          <aside className="p-5 bg-slate-50 border-r border-slate-100 text-sm space-y-4">
            <Info label="Candidate" value={contract.candidateName || contract.candidate} />
            <Info label="Job position" value={contract.roleTitle || contract.role} />
            <Info label="Start date" value={contract.startDate || contract.date} />
            <Info label="Salary" value={contract.salary || '-'} />
            <Info label="Status" value={contract.status || '-'} />
            <Info label="Signature" value={contract.signatureName || 'Not signed'} />
          </aside>
          <main className="overflow-auto p-6 bg-slate-100">
            <article className="mx-auto bg-white shadow-sm border border-slate-200 rounded-xl p-8 text-slate-800" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', width: `${100 / zoom}%`, minHeight: 700 }}>
              <h1 className="text-2xl font-bold text-slate-950 mb-2">{contract.title || 'Employment Contract'}</h1>
              <p className="text-sm text-slate-500 mb-8">{contract.documentType || contract.type || 'Contract'}</p>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-7">{content}</pre>
            </article>
          </main>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide font-bold text-slate-400">{label}</div>
      <div className="font-semibold text-slate-800 mt-1 break-words">{value || '-'}</div>
    </div>
  );
}
