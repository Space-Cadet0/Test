import React, { useState, useMemo } from 'react';
import { SteamLanguageOption } from '../../contracts/steam';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SteamLanguagesTableProps {
  rawSupportedLanguagesHtml?: string;
}

export const SteamLanguagesTable: React.FC<SteamLanguagesTableProps> = ({
  rawSupportedLanguagesHtml,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse Steam raw string: e.g. "English<strong>*</strong>, French<strong>*</strong>, Arabic, ..."
  const languages: SteamLanguageOption[] = useMemo(() => {
    if (!rawSupportedLanguagesHtml) {
      return [
        { name: 'English', hasInterface: true, hasAudio: true, hasSubtitles: true },
        { name: 'French', hasInterface: true, hasAudio: true, hasSubtitles: true },
        { name: 'Italian', hasInterface: true, hasAudio: true, hasSubtitles: true },
        { name: 'German', hasInterface: true, hasAudio: true, hasSubtitles: true },
        { name: 'Spanish - Spain', hasInterface: true, hasAudio: true, hasSubtitles: true },
      ];
    }

    // Split before the disclaimer footer (e.g. "<br><strong>*</strong>languages with full audio support")
    const [langsPart] = rawSupportedLanguagesHtml.split(/<br\s*\/?>/i);
    const items = langsPart.split(',');

    return items
      .map((item) => {
        const trimmed = item.trim();
        const hasAudio = trimmed.includes('*');
        // Clean HTML tags and asterisk
        const cleanName = trimmed.replace(/<[^>]*>/g, '').replace(/\*/g, '').trim();
        if (!cleanName) return null;

        return {
          name: cleanName,
          hasInterface: true,
          hasAudio,
          hasSubtitles: true,
        };
      })
      .filter((l): l is SteamLanguageOption => l !== null);
  }, [rawSupportedLanguagesHtml]);

  const displayedLanguages = isExpanded ? languages : languages.slice(0, 5);

  return (
    <div className="bg-[#16202d] rounded border border-steam-border p-4 shadow-sm space-y-3">
      <div className="text-xs font-bold uppercase tracking-wider text-steam-text border-b border-steam-border/50 pb-2">
        Languages
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px] text-steam-subtext border-collapse">
          <thead>
            <tr className="border-b border-steam-border/40 text-[10px] uppercase font-semibold text-steam-subtext">
              <th className="text-left py-1 pr-2 font-normal"></th>
              <th className="text-center py-1 px-1.5 font-normal w-16">Interface</th>
              <th className="text-center py-1 px-1.5 font-normal w-16">Full Audio</th>
              <th className="text-center py-1 px-1.5 font-normal w-16">Subtitles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-steam-border/20">
            {displayedLanguages.map((lang, idx) => (
              <tr key={idx} className="hover:bg-steam-card/60 transition-colors">
                <td className="py-1.5 pr-2 font-medium text-white truncate max-w-[110px]" title={lang.name}>
                  {lang.name}
                </td>
                <td className="text-center py-1.5 px-1.5">
                  {lang.hasInterface ? (
                    <span className="text-[#66c0f4] font-bold text-xs select-none">✔</span>
                  ) : null}
                </td>
                <td className="text-center py-1.5 px-1.5">
                  {lang.hasAudio ? (
                    <span className="text-[#66c0f4] font-bold text-xs select-none">✔</span>
                  ) : null}
                </td>
                <td className="text-center py-1.5 px-1.5">
                  {lang.hasSubtitles ? (
                    <span className="text-[#66c0f4] font-bold text-xs select-none">✔</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {languages.length > 5 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[11px] text-[#66c0f4] hover:text-white font-medium transition-colors flex items-center gap-1 cursor-pointer pt-1"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Show fewer languages</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>See all {languages.length} supported languages</span>
            </>
          )}
        </button>
      )}

      <div className="text-[10px] text-steam-subtext/80 italic border-t border-steam-border/30 pt-2">
        *languages with full audio support
      </div>
    </div>
  );
};
