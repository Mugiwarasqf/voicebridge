import React from 'react';

const useCases = [
  {
    id: 'content',
    title: 'Content Creation',
    description: 'Narrate blog posts, scripts, newsletters, or social content into audio in a single click. Perfect for podcasters and YouTube creators.',
    preview: (
      <div className="bg-gradient-to-br from-[#EFF6FF] to-[#EEF2FF] rounded-xl p-4 h-40 flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#C7D2FE] flex items-center justify-center">
            <span className="text-xs">✍️</span>
          </div>
          <span className="text-xs font-semibold text-[#4338CA]">Hey! Welcome back to my channel</span>
        </div>
        <div className="space-y-2">
          <div className="bg-white/80 rounded-lg px-3 py-2 flex items-center gap-2 border border-[#E0E7FF]">
            <div className="w-3 h-3 rounded-full bg-[#818CF8]" />
            <span className="text-xs text-[#0A0A0A] font-medium">Add a voiceover now</span>
          </div>
          <div className="flex gap-1 items-end h-6 px-3">
            {[3,5,8,6,9,7,4,6,8,5,7,9,6,4,7,5]?.map((h, i) => (
              <div
                key={`wave-content-${i}`}
                className="flex-1 bg-[#A5B4FC] rounded-full"
                style={{ height: `${h * 2}px` }}
              />
            ))}
          </div>
          <div className="bg-[#6366F1] rounded-lg px-3 py-1.5 flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-white/60" />
            <span className="text-xs text-white font-semibold">Voice cloned successfully!</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'elearning',
    title: 'Docs & E-Learning',
    description: 'Convert written course material, knowledge bases, or technical documentation into accessible, listenable audio automatically.',
    preview: (
      <div className="bg-gradient-to-br from-[#FAF5FF] to-[#FDF2F8] rounded-xl p-4 h-40 relative overflow-hidden">
        <div className="absolute top-2 right-2 bg-[#A855F7] text-white text-xs font-bold px-2 py-0.5 rounded-full">Scheduled</div>
        <div className="text-xs font-bold text-[#0A0A0A] mb-2">AI Narration Report</div>
        <div className="space-y-1.5">
          <div className="bg-white/80 rounded-lg p-2 border border-[#F3E8FF]">
            <p className="text-xs text-[#0A0A0A] leading-tight">Module 3 audio generated at significantly faster speed. Review output at <span className="text-[#9333EA] font-medium">07:42</span></p>
          </div>
          <div className="bg-white/80 rounded-lg p-2 border border-[#F3E8FF]">
            <p className="text-xs text-[#0A0A0A] leading-tight">Voice consistency check passed across 12 lessons. <span className="text-[#9333EA] font-medium">27:18</span></p>
          </div>
        </div>
        <div className="absolute bottom-3 right-3 text-xs text-[#6B7280] font-medium">Send every Friday 10am</div>
      </div>
    ),
  },
  {
    id: 'publishing',
    title: 'Accessibility & Publishing',
    description: 'Convert long-form manuscripts, legal documents, or accessibility content into high-quality listenable audio for broader audiences.',
    preview: (
      <div className="bg-gradient-to-br from-[#ECFDF5] to-[#F0FDFA] rounded-xl p-4 h-40 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-[#10B981] text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            NPC VOICE
          </div>
        </div>
        <div className="bg-white/80 rounded-lg p-2 border border-[#D1FAE5] mb-2">
          <code className="text-xs text-[#0A0A0A] leading-loose block">
            <span className="text-[#059669]">narrately</span>.generate({'{'}<br/>
            &nbsp;&nbsp;voice: <span className="text-[#D97706]">&apos;Julian&apos;</span>,<br/>
            &nbsp;&nbsp;text: script<br/>
            {'}'})
          </code>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 items-end h-5">
            {[2,4,6,4,7,5,3,6,4,5]?.map((h, i) => (
              <div key={`wave-pub-${i}`} className="w-1.5 bg-[#34D399] rounded-full" style={{ height: `${h * 2.5}px` }} />
            ))}
          </div>
          <span className="text-xs font-semibold text-[#047857]">Narrately API</span>
        </div>
      </div>
    ),
  },
];

export function UseCasesSection() {
  return (
    <section id="product" className="py-28 bg-[#F9FAFB]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-14">
          <div className="max-w-lg">
            <p
              className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#4B5563] mb-4"
            >
              WHAT WE OFFER
            </p>
            <h2
              className="font-extrabold text-[#0A0A0A]"
              style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', lineHeight: 1.2, letterSpacing: '-0.02em' }}
            >
              Built for every story,<br />across every workflow.
            </h2>
          </div>
          <p className="text-sm text-[#6B7280] max-w-xs leading-relaxed lg:mt-12">
            Whether you are an indie creator or a global enterprise, Narrately&apos;s scalable narration engine fits directly into your existing workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {useCases?.map((uc) => (
            <div
              key={`usecase-${uc?.id}`}
              className="bg-white rounded-xl border border-[#F0F0F0] p-5 hover:shadow-lg transition-shadow duration-300"
            >
              {uc?.preview}
              <div className="mt-4">
                <h3 className="text-base font-bold text-[#0A0A0A] mb-1.5">{uc?.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{uc?.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}