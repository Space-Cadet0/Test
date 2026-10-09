import React, { useState, useMemo } from 'react';
import { SteamLanguageOption } from '../../contracts/steam';

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

    const [langsPart] = rawSupportedLanguagesHtml.split(/<br\s*\/?>/i);
    const items = langsPart.split(',');

    return items
      .map((item) => {
        const trimmed = item.trim();
        const hasAudio = trimmed.includes('*');
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
    <div className="mb-4">
      <div className="steam-block-title">
        Languages
      </div>

      <div className="overflow-x-auto">
        <table className="steam-lang-table">
          <thead>
            <tr>
              <th className="text-left font-normal"></th>
              <th className="checkcol">Interface</th>
              <th className="checkcol">Full Audio</th>
              <th className="checkcol">Subtitles</th>
            </tr>
          </thead>
          <tbody>
            {displayedLanguages.map((lang, idx) => (
              <tr key={idx}>
                <td className="lang-name truncate max-w-[110px]" title={lang.name}>
                  {lang.name}
                </td>
                <td className="checkcol">
                  {lang.hasInterface ? (
                    <span className="check">✔</span>
                  ) : null}
                </td>
                <td className="checkcol">
                  {lang.hasAudio ? (
                    <span className="check">✔</span>
                  ) : null}
                </td>
                <td className="checkcol">
                  {lang.hasSubtitles ? (
                    <span className="check">✔</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {languages.length > 5 && (
        <a
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[11px] text-[#67c1f5] hover:text-white hover:underline cursor-pointer inline-block mt-1 font-normal select-none"
        >
          {isExpanded
            ? 'Show fewer languages'
            : `See all ${languages.length} supported languages`}
        </a>
      )}

      <div className="text-[10px] text-[#61686d] italic mt-1">
        *languages with full audio support
      </div>
    </div>
  );
};
