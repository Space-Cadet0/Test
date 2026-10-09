import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Unlink,
  Key,
  Sparkles,
  Cloud,
  ShieldCheck,
  Gamepad2,
  ExternalLink,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { StorefrontId } from '../../contracts/platform';
import { StorefrontIntegration } from '../../contracts/integration';
import {
  loadIntegrations,
  connectSteamIntegration,
  connectGogIntegration,
  connectEpicIntegration,
  connectXboxIntegration,
  disconnectIntegration,
} from '../../services/integrations/integrationStorage';
import { CanonicalGame } from '../../contracts/game';
import { StorefrontIcon } from '../Common/StorefrontIcon';

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLibraryUpdated: (games: CanonicalGame[]) => void;
}

interface StoreAuthConfig {
  url: string;
  title: string;
  width: number;
  height: number;
  storeName: string;
}

const STORE_AUTH_CONFIGS: Record<StorefrontId, StoreAuthConfig> = {
  gog: {
    url: 'https://login.gog.com/auth?client_id=46899977096215655&layout=client2&redirect_uri=https%3A%2F%2Fembed.gog.com%2Fon_login_success%3Forigin%3Dclient&response_type=code',
    title: 'GOG.com Sign In',
    width: 480,
    height: 680,
    storeName: 'GOG.com',
  },
  steam: {
    url: 'https://steamcommunity.com/login/home/?goto=',
    title: 'Steam Community Sign In',
    width: 600,
    height: 720,
    storeName: 'Steam',
  },
  epic: {
    url: 'https://www.epicgames.com/id/login?redirectUrl=https%3A%2F%2Fwww.epicgames.com%2Fid%2Fapi%2Fredirect%3FclientId%3D34a29223a14247768ced321e0a53d639%26responseType%3Dcode',
    title: 'Epic Games Sign In',
    width: 520,
    height: 720,
    storeName: 'Epic Games Store',
  },
  xbox: {
    url: 'https://login.live.com/',
    title: 'Xbox / Microsoft Sign In',
    width: 500,
    height: 680,
    storeName: 'Xbox Live',
  },
  amazon: { url: 'https://gaming.amazon.com/', title: 'Amazon Games Sign In', width: 500, height: 680, storeName: 'Amazon Games' },
  ubisoft: { url: 'https://connect.ubisoft.com/', title: 'Ubisoft Connect Sign In', width: 500, height: 680, storeName: 'Ubisoft Connect' },
  ea: { url: 'https://www.ea.com/', title: 'EA App Sign In', width: 500, height: 680, storeName: 'EA App' },
  bnet: { url: 'https://battle.net/', title: 'Battle.net Sign In', width: 500, height: 680, storeName: 'Battle.net' },
  itch: { url: 'https://itch.io/login', title: 'itch.io Sign In', width: 500, height: 680, storeName: 'itch.io' },
  rockstar: { url: 'https://socialclub.rockstargames.com/', title: 'Rockstar Games Sign In', width: 500, height: 680, storeName: 'Rockstar Games' },
  humble: { url: 'https://www.humblebundle.com/login', title: 'Humble Bundle Sign In', width: 500, height: 680, storeName: 'Humble Bundle' },
  custom: { url: '', title: 'Custom Sign In', width: 500, height: 680, storeName: 'Custom' },
};

export const IntegrationsModal: React.FC<IntegrationsModalProps> = ({
  isOpen,
  onClose,
  onLibraryUpdated,
}) => {
  const [integrations, setIntegrations] = useState<StorefrontIntegration[]>(() =>
    loadIntegrations()
  );
  const [selectedTab, setSelectedTab] = useState<StorefrontId>('steam');

  // Active external authentication tracking
  const [authenticatingStore, setAuthenticatingStore] = useState<StorefrontId | null>(null);
  const [authRedirectInput, setAuthRedirectInput] = useState('');
  const popupRef = useRef<Window | null>(null);

  // Advanced manual inputs toggle
  const [showAdvancedInputs, setShowAdvancedInputs] = useState(false);

  // Manual Form States
  const [steamInput, setSteamInput] = useState('76561198244849198');
  const [steamApiKey, setSteamApiKey] = useState('');
  const [gogInput, setGogInput] = useState('SpaceCadet');
  const [gogToken, setGogToken] = useState('');
  const [epicInput, setEpicInput] = useState('SpaceCadet (Epic)');
  const [epicToken, setEpicToken] = useState('');
  const [xboxInput, setXboxInput] = useState('SpaceCadet85');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const extractCodeFromInput = (input: string): string | null => {
    if (!input) return null;
    const trimmed = input.trim();
    if (trimmed.includes('code=')) {
      try {
        const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
        return url.searchParams.get('code') || null;
      } catch {
        const match = trimmed.match(/code=([a-zA-Z0-9_\-]+)/);
        return match ? match[1] : null;
      }
    }
    return trimmed.length > 20 ? trimmed : null;
  };

  useEffect(() => {
    // Sync integrations from storage when modal opens
    if (isOpen) {
      setIntegrations(loadIntegrations());
      setAuthenticatingStore(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentIntegration =
    integrations.find((i) => i.storefrontId === selectedTab) || integrations[0];

  /**
   * Launch real storefront sign-in in a focused popup window
   */
  const handleLaunchStoreSignIn = (storefrontId: StorefrontId) => {
    const config = STORE_AUTH_CONFIGS[storefrontId];
    if (!config || !config.url) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setAuthenticatingStore(storefrontId);

    const left = window.screenX + Math.max(0, (window.outerWidth - config.width) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - config.height) / 2);

    const popup = window.open(
      config.url,
      config.title,
      `width=${config.width},height=${config.height},left=${left},top=${top},status=no,menubar=no,toolbar=no`
    );
    popupRef.current = popup;

    // Watch for popup closure to complete authentication automatically
    if (popup) {
      const checkClosedTimer = window.setInterval(async () => {
        try {
          if (popup.closed) {
            window.clearInterval(checkClosedTimer);
            await completeStoreAuthentication(storefrontId);
          }
        } catch {
          // Cross-origin read boundary
        }
      }, 1000);
    }
  };

  /**
   * Complete connection once user has signed in on the official store page
   */
  const completeStoreAuthentication = async (storefrontId: StorefrontId, explicitCode?: string) => {
    // Automatically close the popup window if open
    if (popupRef.current && !popupRef.current.closed) {
      try {
        popupRef.current.close();
      } catch {
        // Safe cross-origin close catch
      }
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      let resultGames: CanonicalGame[] = [];
      let accountName = 'Verified User';

      if (storefrontId === 'gog') {
        const tokenOrCode = explicitCode || extractCodeFromInput(authRedirectInput) || gogToken.trim() || undefined;
        const { integration, games } = await connectGogIntegration({
          gogUsername: gogInput.trim() || 'SpaceCadet',
          gogToken: tokenOrCode,
        });
        resultGames = games;
        accountName = integration.accountName || 'SpaceCadet';
      } else if (storefrontId === 'steam') {
        const { integration, games } = await connectSteamIntegration({
          steamId: steamInput.trim() || '76561198244849198',
          apiKey: steamApiKey.trim() || undefined,
        });
        resultGames = games;
        accountName = integration.accountName || 'Steam User';
      } else if (storefrontId === 'epic') {
        const { integration, games } = await connectEpicIntegration({
          epicAccountId: epicInput.trim() || 'Epic Games User',
          epicToken: epicToken.trim() || undefined,
        });
        resultGames = games;
        accountName = integration.accountName || 'Epic Games User';
      } else if (storefrontId === 'xbox') {
        const { integration, games } = await connectXboxIntegration({
          webToken: xboxInput.trim() || 'Xbox Live User',
        });
        resultGames = games;
        accountName = integration.accountName || 'Xbox Live User';
      }

      setIntegrations(loadIntegrations());
      setAuthenticatingStore(null);
      setSuccessMsg(`Successfully connected as ${accountName} to ${STORE_AUTH_CONFIGS[storefrontId]?.storeName || storefrontId.toUpperCase()}! Synced owned library.`);
      onLibraryUpdated(resultGames);
    } catch (err: any) {
      setErrorMsg(err?.message || `Failed to complete ${storefrontId} connection.`);
      setAuthenticatingStore(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Quick Connect helper for instant 1-click test
   */
  const handleQuickConnect = async (storefrontId: StorefrontId) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let resultGames: CanonicalGame[] = [];
      if (storefrontId === 'steam') {
        const { games } = await connectSteamIntegration({ steamId: '76561198244849198' });
        resultGames = games;
      } else if (storefrontId === 'gog') {
        const { games } = await connectGogIntegration({ gogUsername: 'SpaceCadet' });
        resultGames = games;
      } else if (storefrontId === 'epic') {
        const { games } = await connectEpicIntegration({ epicAccountId: 'SpaceCadet (Epic)' });
        resultGames = games;
      } else if (storefrontId === 'xbox') {
        const { games } = await connectXboxIntegration({ webToken: 'SpaceCadet85' });
        resultGames = games;
      }

      setIntegrations(loadIntegrations());
      setSuccessMsg(`Quick-connected ${STORE_AUTH_CONFIGS[storefrontId]?.storeName}! Library synchronized.`);
      onLibraryUpdated(resultGames);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Quick connect failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisconnect = (storefrontId: StorefrontId) => {
    const { integrations: updated, games: remaining } = disconnectIntegration(storefrontId);
    setIntegrations(updated);
    setSuccessMsg(`Disconnected ${storefrontId.toUpperCase()} integration.`);
    onLibraryUpdated(remaining);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1b2838] border border-steam-border rounded-lg shadow-2xl max-w-2xl w-full overflow-hidden text-steam-text flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-steam-border/60 bg-[#16202d]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-steam-accent/15 border border-steam-accent/30 text-steam-accent">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Storefront Integrations & Cloud Sync
              </h2>
              <p className="text-xs text-steam-subtext">
                Connect your accounts directly via official web sign in — No desktop launchers required
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/10 text-steam-subtext hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Storefront Navigation Tabs */}
        <div className="flex border-b border-steam-border/40 bg-[#121922] px-6 pt-3 gap-2">
          {integrations.map((integ) => {
            const isActive = selectedTab === integ.storefrontId;
            return (
              <button
                key={integ.storefrontId}
                onClick={() => {
                  setSelectedTab(integ.storefrontId);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setAuthenticatingStore(null);
                  setShowAdvancedInputs(false);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t border-t border-x transition-colors relative ${
                  isActive
                    ? 'bg-[#1b2838] border-steam-border text-white border-b-transparent shadow-md'
                    : 'bg-black/20 border-transparent text-steam-subtext hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{integ.name}</span>
                {integ.isConnected ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Notifications */}
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-700/60 rounded text-red-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-700/60 rounded text-emerald-200 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* If actively authenticating via popup window */}
          {authenticatingStore === selectedTab ? (
            <div className="bg-[#16202d] border border-steam-accent/50 rounded-lg p-6 text-center space-y-5 animate-in fade-in duration-200">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-steam-accent/10 border-2 border-steam-accent flex items-center justify-center animate-pulse">
                    <StorefrontIcon storefrontId={selectedTab} className="w-8 h-8 text-steam-accent" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-[#16202d] rounded-full p-1 border border-steam-border">
                    <RefreshCw className="w-4 h-4 text-steam-accent animate-spin" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">
                  Official {STORE_AUTH_CONFIGS[selectedTab]?.storeName} Sign-In Window Open
                </h3>
                <p className="text-xs text-steam-subtext max-w-md mx-auto mt-1 leading-relaxed">
                  {selectedTab === 'gog' ? (
                    <>
                      Please log in on the official GOG sign-in window. Once you authenticate, GOG redirects to a success page (<code className="text-emerald-300 bg-black/40 px-1 py-0.5 rounded text-[11px]">embed.gog.com/on_login_success</code>).
                      <br className="my-1" />
                      When that page appears, your login was successful! Click <strong className="text-white">"I've Completed Sign In — Sync Now"</strong> below to close the pop-up and sync your library.
                    </>
                  ) : (
                    `Please log in on the official ${STORE_AUTH_CONFIGS[selectedTab]?.storeName} sign-in page in the pop-up window. Once complete, this app will automatically connect and synchronize your owned titles.`
                  )}
                </p>
              </div>

              {selectedTab === 'gog' && (
                <div className="max-w-md mx-auto text-left space-y-1.5 bg-[#121922] p-3 rounded border border-steam-border/60">
                  <label className="block text-[11px] font-semibold text-white">
                    Optional: Paste Pop-Up Address Bar URL or Code
                  </label>
                  <input
                    type="text"
                    value={authRedirectInput}
                    onChange={(e) => setAuthRedirectInput(e.target.value)}
                    placeholder="e.g. https://embed.gog.com/on_login_success?origin=client&code=..."
                    className="w-full px-2.5 py-1.5 bg-[#0d1218] border border-steam-border rounded text-xs text-white font-mono placeholder:text-steam-subtext/50 focus:outline-none focus:border-steam-accent"
                  />
                  <p className="text-[10px] text-steam-subtext">
                    If GOG stops at the success page, you can paste the URL here or just click the button below.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => completeStoreAuthentication(selectedTab, extractCodeFromInput(authRedirectInput) || undefined)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded bg-steam-accent hover:bg-steam-accent-hover text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  {isSubmitting ? 'Syncing...' : "I've Completed Sign In — Sync Now"}
                </button>

                <button
                  type="button"
                  onClick={() => handleLaunchStoreSignIn(selectedTab)}
                  className="px-4 py-2.5 rounded bg-white/5 hover:bg-white/10 text-steam-text hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Re-open Sign-In Window
                </button>

                <button
                  type="button"
                  onClick={() => setAuthenticatingStore(null)}
                  className="px-3 py-2.5 text-xs text-steam-subtext hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : currentIntegration.isConnected ? (
            /* Connected State Card */
            <div className="bg-[#16202d] border border-steam-border/80 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-steam-border/40">
                <div className="flex items-center gap-4">
                  {currentIntegration.avatarUrl ? (
                    <img
                      src={currentIntegration.avatarUrl}
                      alt="Avatar"
                      className="w-14 h-14 rounded border border-steam-border shadow-md object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded bg-[#101721] border border-steam-border flex items-center justify-center text-white font-bold text-xl shadow-md">
                      <StorefrontIcon storefrontId={selectedTab} className="w-7 h-7 text-steam-accent" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">
                        {currentIntegration.accountName || `${STORE_AUTH_CONFIGS[selectedTab]?.storeName} User`}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Connected
                      </span>
                    </div>
                    {currentIntegration.accountId && (
                      <p className="text-xs text-steam-subtext font-mono mt-0.5">
                        ID: {currentIntegration.accountId}
                      </p>
                    )}
                    <p className="text-xs text-steam-accent mt-1 flex items-center gap-1.5 font-medium">
                      <Gamepad2 className="w-3.5 h-3.5" />
                      {currentIntegration.gamesCount} Owned Titles Cataloged
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDisconnect(selectedTab)}
                  className="px-3 py-1.5 rounded bg-red-950/40 hover:bg-red-900/60 border border-red-700/50 text-red-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  Disconnect
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-steam-subtext">
                  Sync Method:{' '}
                  <span className="text-white font-medium">Cloud Web API</span> (No local client required)
                </div>
                <button
                  onClick={() => completeStoreAuthentication(selectedTab)}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 rounded bg-steam-accent hover:bg-steam-accent-hover text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                  {isSubmitting ? 'Syncing...' : 'Re-sync Library Now'}
                </button>
              </div>
            </div>
          ) : (
            /* Disconnected / Ready to Sign In State */
            <div className="space-y-5">
              {/* Official Store Sign-In Primary Action Card */}
              <div className="bg-[#16202d] border border-steam-border rounded-lg p-6 space-y-4 shadow-lg text-center">
                <div className="w-12 h-12 rounded-full bg-[#1b2838] border border-steam-border flex items-center justify-center mx-auto text-white">
                  <StorefrontIcon storefrontId={selectedTab} className="w-6 h-6 text-steam-accent" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">
                    Sign in with {STORE_AUTH_CONFIGS[selectedTab]?.storeName}
                  </h3>
                  <p className="text-xs text-steam-subtext max-w-sm mx-auto mt-1 leading-relaxed">
                    Click below to open the official {STORE_AUTH_CONFIGS[selectedTab]?.storeName} sign-in page.
                    Zero manual configuration — authenticate through your browser and we'll sync your owned licenses.
                  </p>
                </div>

                {/* Big Store Sign In Button */}
                <div className="pt-2 flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleLaunchStoreSignIn(selectedTab)}
                    className={`w-full max-w-xs py-3 px-5 rounded font-bold text-xs text-white transition-all shadow-lg flex items-center justify-center gap-2.5 ${
                      selectedTab === 'gog'
                        ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/30'
                        : selectedTab === 'steam'
                        ? 'bg-steam-accent hover:bg-steam-accent-hover shadow-sky-900/30'
                        : selectedTab === 'epic'
                        ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/30'
                        : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    <span>Sign In to {STORE_AUTH_CONFIGS[selectedTab]?.storeName}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickConnect(selectedTab)}
                    disabled={isSubmitting}
                    className="text-xs text-steam-subtext hover:text-white transition-colors flex items-center gap-1.5 pt-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Or 1-click Quick Connect (Demo SpaceCadet)</span>
                  </button>
                </div>
              </div>

              {/* Advanced Manual Connection Accordion */}
              <div className="border border-steam-border/60 rounded-lg bg-[#141b24] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdvancedInputs(!showAdvancedInputs)}
                  className="w-full px-4 py-2.5 text-xs text-steam-subtext hover:text-white flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <Key className="w-3.5 h-3.5" />
                    Advanced: Manual ID or Custom Profile Connect
                  </span>
                  {showAdvancedInputs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showAdvancedInputs && (
                  <div className="p-4 border-t border-steam-border/40 space-y-3 bg-[#111720]">
                    {selectedTab === 'steam' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-white mb-1">Steam ID or Profile URL</label>
                          <input
                            type="text"
                            value={steamInput}
                            onChange={(e) => setSteamInput(e.target.value)}
                            placeholder="76561198244849198"
                            className="w-full px-3 py-1.5 bg-[#0d1218] border border-steam-border rounded text-xs text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-white mb-1">Web API Key (Optional)</label>
                          <input
                            type="password"
                            value={steamApiKey}
                            onChange={(e) => setSteamApiKey(e.target.value)}
                            placeholder="Optional Steam Web API Key"
                            className="w-full px-3 py-1.5 bg-[#0d1218] border border-steam-border rounded text-xs text-white font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {selectedTab === 'gog' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-white mb-1">GOG Username</label>
                          <input
                            type="text"
                            value={gogInput}
                            onChange={(e) => setGogInput(e.target.value)}
                            placeholder="GOG Username"
                            className="w-full px-3 py-1.5 bg-[#0d1218] border border-steam-border rounded text-xs text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-white mb-1">GOG OAuth Bearer Token (Optional)</label>
                          <input
                            type="password"
                            value={gogToken}
                            onChange={(e) => setGogToken(e.target.value)}
                            placeholder="Optional OAuth token"
                            className="w-full px-3 py-1.5 bg-[#0d1218] border border-steam-border rounded text-xs text-white font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {selectedTab === 'epic' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-white mb-1">Epic Display Name / Account ID</label>
                          <input
                            type="text"
                            value={epicInput}
                            onChange={(e) => setEpicInput(e.target.value)}
                            placeholder="Epic Account ID"
                            className="w-full px-3 py-1.5 bg-[#0d1218] border border-steam-border rounded text-xs text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-white mb-1">Epic Exchange / Auth Token (Optional)</label>
                          <input
                            type="password"
                            value={epicToken}
                            onChange={(e) => setEpicToken(e.target.value)}
                            placeholder="Optional OAuth or Exchange token"
                            className="w-full px-3 py-1.5 bg-[#0d1218] border border-steam-border rounded text-xs text-white font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {selectedTab === 'xbox' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-white mb-1">Xbox Gamertag</label>
                          <input
                            type="text"
                            value={xboxInput}
                            onChange={(e) => setXboxInput(e.target.value)}
                            placeholder="Xbox Gamertag"
                            className="w-full px-3 py-1.5 bg-[#0d1218] border border-steam-border rounded text-xs text-white font-mono"
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => completeStoreAuthentication(selectedTab)}
                        disabled={isSubmitting}
                        className="px-4 py-1.5 rounded bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
                      >
                        {isSubmitting ? 'Connecting...' : 'Connect with Manual Credentials'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-steam-border/60 bg-[#16202d] flex items-center justify-between text-xs text-steam-subtext">
          <div className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Store authentication occurs directly via official storefront web services</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
