import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Unlink,
  Key,
  Globe,
  Sparkles,
  Cloud,
  ShieldCheck,
  Gamepad2,
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

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLibraryUpdated: (games: CanonicalGame[]) => void;
}

export const IntegrationsModal: React.FC<IntegrationsModalProps> = ({
  isOpen,
  onClose,
  onLibraryUpdated,
}) => {
  const [integrations, setIntegrations] = useState<StorefrontIntegration[]>(() =>
    loadIntegrations()
  );
  const [selectedTab, setSelectedTab] = useState<StorefrontId>('steam');

  // Steam Form State
  const [steamInput, setSteamInput] = useState('76561198244849198');
  const [steamApiKey, setSteamApiKey] = useState('');

  // GOG Form State
  const [gogInput, setGogInput] = useState('SpaceCadet');
  const [gogToken, setGogToken] = useState('');

  // Epic Form State
  const [epicInput, setEpicInput] = useState('SpaceCadet (Epic)');
  const [epicToken, setEpicToken] = useState('');

  // Xbox Form State
  const [xboxInput, setXboxInput] = useState('SpaceCadet85');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentIntegration =
    integrations.find((i) => i.storefrontId === selectedTab) || integrations[0];

  const handleConnectSteam = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      let steamId = steamInput.trim();
      const profileMatch = steamId.match(/profiles\/(\d{17})/i);
      if (profileMatch) {
        steamId = profileMatch[1];
      }

      const { games } = await connectSteamIntegration({
        steamId,
        apiKey: steamApiKey.trim() || undefined,
      });

      setIntegrations(loadIntegrations());
      setSuccessMsg(`Successfully connected to Steam! ${games.length} games synced.`);
      onLibraryUpdated(games);
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          'Failed to connect to Steam. Please check your Steam ID or provide a Steam Web API Key.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickConnectSpaceCadet = async () => {
    setSteamInput('76561198244849198');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const { games } = await connectSteamIntegration({
        steamId: '76561198244849198',
      });
      setIntegrations(loadIntegrations());
      setSuccessMsg(`Connected as SpaceCadet! ${games.length} verified owned titles synced.`);
      onLibraryUpdated(games);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to connect.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConnectGog = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const { integration, games } = await connectGogIntegration({
        gogUsername: gogInput.trim() || 'SpaceCadet',
        gogToken: gogToken.trim() || undefined,
      });

      setIntegrations(loadIntegrations());
      setSuccessMsg(`Successfully connected to GOG! ${integration.gamesCount} titles synced.`);
      onLibraryUpdated(games);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to connect to GOG.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickConnectGog = async () => {
    setGogInput('SpaceCadet');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const { integration, games } = await connectGogIntegration({
        gogUsername: 'SpaceCadet',
      });
      setIntegrations(loadIntegrations());
      setSuccessMsg(`Connected as ${integration.accountName}! ${integration.gamesCount} GOG titles synced.`);
      onLibraryUpdated(games);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to connect to GOG.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConnectEpic = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const { integration, games } = await connectEpicIntegration({
        epicAccountId: epicInput.trim() || 'SpaceCadet (Epic)',
        epicToken: epicToken.trim() || undefined,
      });

      setIntegrations(loadIntegrations());
      setSuccessMsg(`Successfully connected to Epic Games! ${integration.gamesCount} titles synced.`);
      onLibraryUpdated(games);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to connect to Epic Games.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickConnectEpic = async () => {
    setEpicInput('SpaceCadet (Epic)');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const { integration, games } = await connectEpicIntegration({
        epicAccountId: 'SpaceCadet (Epic)',
      });
      setIntegrations(loadIntegrations());
      setSuccessMsg(`Connected as ${integration.accountName}! ${integration.gamesCount} Epic titles synced.`);
      onLibraryUpdated(games);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to connect to Epic Games.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConnectXbox = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const { integration, games } = await connectXboxIntegration({
        webToken: xboxInput.trim() || 'SpaceCadet85',
      });

      setIntegrations(loadIntegrations());
      setSuccessMsg(`Successfully connected to Xbox! ${integration.gamesCount} titles synced.`);
      onLibraryUpdated(games);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to connect to Xbox.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickConnectXbox = async () => {
    setXboxInput('SpaceCadet85');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const { integration, games } = await connectXboxIntegration({
        webToken: 'SpaceCadet85',
      });
      setIntegrations(loadIntegrations());
      setSuccessMsg(`Connected as ${integration.accountName}! ${integration.gamesCount} Xbox titles synced.`);
      onLibraryUpdated(games);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to connect to Xbox.');
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
                Connect libraries directly via web APIs — No desktop launchers required
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

          {/* STEAM TAB */}
          {selectedTab === 'steam' && (
            <div className="space-y-6">
              {currentIntegration.isConnected ? (
                /* Connected State Card */
                <div className="bg-[#16202d] border border-steam-border/80 rounded-lg p-5 space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-steam-border/40">
                    <div className="flex items-center gap-4">
                      <img
                        src={
                          currentIntegration.avatarUrl ||
                          'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'
                        }
                        alt="Avatar"
                        className="w-14 h-14 rounded border border-steam-border shadow-md"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">
                            {currentIntegration.accountName || 'SpaceCadet'}
                          </h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Connected
                          </span>
                        </div>
                        <p className="text-xs text-steam-subtext font-mono mt-0.5">
                          SteamID: {currentIntegration.accountId || '76561198244849198'}
                        </p>
                        <p className="text-xs text-steam-accent mt-1 flex items-center gap-1.5 font-medium">
                          <Gamepad2 className="w-3.5 h-3.5" />
                          {currentIntegration.gamesCount} Owned Games Cataloged
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDisconnect('steam')}
                      className="px-3 py-1.5 rounded bg-red-950/40 hover:bg-red-900/60 border border-red-700/50 text-red-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      Disconnect
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-steam-subtext">
                      Sync Method:{' '}
                      <span className="text-white font-medium">Steam Cloud Web API</span> (No
                      launcher required)
                    </div>
                    <button
                      onClick={() => handleConnectSteam()}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 rounded bg-steam-accent hover:bg-steam-accent-hover text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`}
                      />
                      {isSubmitting ? 'Syncing...' : 'Sync Library Now'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Disconnected Connection Form */
                <div className="space-y-5">
                  <div className="p-4 bg-sky-950/20 border border-sky-800/40 rounded-lg text-xs text-sky-200/90 leading-relaxed flex items-start gap-3">
                    <Cloud className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block mb-1">
                        Zero-Client Web Synchronization
                      </strong>
                      You don't need Steam installed on this computer. Enter your public Steam ID or
                      Profile URL to query your owned games and play statistics directly from the
                      Steam Cloud.
                    </div>
                  </div>

                  <form onSubmit={handleConnectSteam} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-white mb-1.5">
                        Steam ID or Custom Profile URL
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={steamInput}
                          onChange={(e) => setSteamInput(e.target.value)}
                          placeholder="e.g. 76561198244849198 or https://steamcommunity.com/id/spacecadet"
                          className="w-full px-3 py-2 bg-[#121922] border border-steam-border rounded text-sm text-white placeholder-steam-subtext/60 focus:outline-none focus:border-steam-accent pr-10 font-mono text-xs"
                        />
                        <Globe className="w-4 h-4 text-steam-subtext absolute right-3 top-2.5 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-white">
                          Steam Web API Key{' '}
                          <span className="text-steam-subtext font-normal">(Optional)</span>
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type="password"
                          value={steamApiKey}
                          onChange={(e) => setSteamApiKey(e.target.value)}
                          placeholder="Recommended for private libraries"
                          className="w-full px-3 py-2 bg-[#121922] border border-steam-border rounded text-sm text-white placeholder-steam-subtext/60 focus:outline-none focus:border-steam-accent pr-10 font-mono text-xs"
                        />
                        <Key className="w-4 h-4 text-steam-subtext absolute right-3 top-2.5 pointer-events-none" />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={handleQuickConnectSpaceCadet}
                        className="px-3.5 py-2 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        Quick Connect SpaceCadet
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting || !steamInput.trim()}
                        className="px-5 py-2 rounded bg-steam-accent hover:bg-steam-accent-hover text-white text-xs font-bold transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                      >
                        {isSubmitting ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-4 h-4" />
                        )}
                        {isSubmitting ? 'Connecting...' : 'Connect Steam Account'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* GOG TAB */}
          {selectedTab === 'gog' && (
            <div className="space-y-6">
              <div className="p-4 bg-purple-950/20 border border-purple-800/40 rounded-lg text-xs text-purple-200/90 leading-relaxed flex items-start gap-3">
                <Cloud className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-1">GOG.com Cloud Integration</strong>
                  Connect your GOG games without needing GOG Galaxy installed. We sync your owned
                  licenses and classic titles directly through GOG's cloud web API.
                </div>
              </div>

              {currentIntegration.isConnected ? (
                /* Connected State Card */
                <div className="bg-[#16202d] border border-purple-500/30 rounded-lg p-5 space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-steam-border/40">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded bg-purple-900/60 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold text-xl shadow-md">
                        GOG
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">
                            {currentIntegration.accountName || 'SpaceCadet'}
                          </h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Connected
                          </span>
                        </div>
                        <p className="text-xs text-purple-300 font-medium mt-1 flex items-center gap-1.5">
                          <Gamepad2 className="w-3.5 h-3.5" />
                          {currentIntegration.gamesCount} GOG Titles Cataloged
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDisconnect('gog')}
                      className="px-3 py-1.5 rounded bg-red-950/40 hover:bg-red-900/60 border border-red-700/50 text-red-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      Disconnect
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-steam-subtext">
                      Sync Method:{' '}
                      <span className="text-white font-medium">GOG Cloud Web API</span> (No Galaxy client required)
                    </div>
                    <button
                      onClick={() => handleConnectGog()}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                      {isSubmitting ? 'Syncing...' : 'Sync GOG Library'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Connection Form */
                <form onSubmit={handleConnectGog} className="bg-[#16202d] border border-steam-border rounded-lg p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">GOG Account Web Connect</h3>
                      <p className="text-xs text-steam-subtext mt-0.5">
                        Sync games and licenses directly from GOG without desktop launcher.
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-800 text-gray-400 border border-gray-700">
                      Not Connected
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white mb-1.5">
                      GOG Username or Profile ID
                    </label>
                    <input
                      type="text"
                      value={gogInput}
                      onChange={(e) => setGogInput(e.target.value)}
                      placeholder="e.g. SpaceCadet or your GOG username"
                      className="w-full px-3 py-2 bg-[#121922] border border-steam-border rounded text-sm text-white placeholder-steam-subtext/60 focus:outline-none focus:border-purple-500 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white mb-1.5">
                      GOG OAuth Access Token <span className="text-steam-subtext font-normal">(Optional for private libraries)</span>
                    </label>
                    <input
                      type="password"
                      value={gogToken}
                      onChange={(e) => setGogToken(e.target.value)}
                      placeholder="Optional GOG bearer token"
                      className="w-full px-3 py-2 bg-[#121922] border border-steam-border rounded text-sm text-white placeholder-steam-subtext/60 focus:outline-none focus:border-purple-500 font-mono text-xs"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleQuickConnectGog}
                      className="px-3.5 py-2 rounded bg-purple-950/40 hover:bg-purple-900/60 border border-purple-700/50 text-purple-200 text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      Quick Connect SpaceCadet (GOG)
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      {isSubmitting ? 'Connecting...' : 'Connect GOG Account'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* EPIC TAB */}
          {selectedTab === 'epic' && (
            <div className="space-y-6">
              <div className="p-4 bg-zinc-900 border border-zinc-700/50 rounded-lg text-xs text-zinc-300 leading-relaxed flex items-start gap-3">
                <Cloud className="w-5 h-5 text-zinc-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-1">Epic Games Store Cloud Sync</strong>
                  Sync your Epic Games library entitlements directly via Epic's cloud services
                  without the Epic Games Launcher.
                </div>
              </div>

              {currentIntegration.isConnected ? (
                /* Connected State Card */
                <div className="bg-[#16202d] border border-blue-500/30 rounded-lg p-5 space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-steam-border/40">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-bold text-xl shadow-md">
                        EPIC
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">
                            {currentIntegration.accountName || 'SpaceCadet (Epic)'}
                          </h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Connected
                          </span>
                        </div>
                        <p className="text-xs text-blue-300 font-medium mt-1 flex items-center gap-1.5">
                          <Gamepad2 className="w-3.5 h-3.5" />
                          {currentIntegration.gamesCount} Epic Titles Cataloged
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDisconnect('epic')}
                      className="px-3 py-1.5 rounded bg-red-950/40 hover:bg-red-900/60 border border-red-700/50 text-red-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      Disconnect
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-steam-subtext">
                      Sync Method:{' '}
                      <span className="text-white font-medium">Epic Cloud Services</span> (No launcher required)
                    </div>
                    <button
                      onClick={() => handleConnectEpic()}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                      {isSubmitting ? 'Syncing...' : 'Sync Epic Library'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Connection Form */
                <form onSubmit={handleConnectEpic} className="bg-[#16202d] border border-steam-border rounded-lg p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">Epic Games Account Connect</h3>
                      <p className="text-xs text-steam-subtext mt-0.5">
                        Sync owned titles, exclusives, and weekly free game entitlements.
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-800 text-gray-400 border border-gray-700">
                      Not Connected
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white mb-1.5">
                      Epic Games Display Name or Account ID
                    </label>
                    <input
                      type="text"
                      value={epicInput}
                      onChange={(e) => setEpicInput(e.target.value)}
                      placeholder="e.g. SpaceCadet or Epic Account ID"
                      className="w-full px-3 py-2 bg-[#121922] border border-steam-border rounded text-sm text-white placeholder-steam-subtext/60 focus:outline-none focus:border-blue-500 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white mb-1.5">
                      Epic Exchange Code / Auth Token <span className="text-steam-subtext font-normal">(Optional)</span>
                    </label>
                    <input
                      type="password"
                      value={epicToken}
                      onChange={(e) => setEpicToken(e.target.value)}
                      placeholder="Optional Epic authorization token"
                      className="w-full px-3 py-2 bg-[#121922] border border-steam-border rounded text-sm text-white placeholder-steam-subtext/60 focus:outline-none focus:border-blue-500 font-mono text-xs"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleQuickConnectEpic}
                      className="px-3.5 py-2 rounded bg-blue-950/40 hover:bg-blue-900/60 border border-blue-700/50 text-blue-200 text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      Quick Connect SpaceCadet (Epic)
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      {isSubmitting ? 'Connecting...' : 'Connect Epic Account'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* XBOX TAB */}
          {selectedTab === 'xbox' && (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-lg text-xs text-emerald-200/90 leading-relaxed flex items-start gap-3">
                <Cloud className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-1">Xbox / Microsoft Store Cloud Sync</strong>
                  Sync digital PC and Game Pass purchases via your Microsoft account without the Xbox
                  desktop app.
                </div>
              </div>

              {currentIntegration.isConnected ? (
                /* Connected State Card */
                <div className="bg-[#16202d] border border-emerald-500/30 rounded-lg p-5 space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-steam-border/40">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold text-xl shadow-md">
                        XBOX
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">
                            {currentIntegration.accountName || 'SpaceCadet85 (Xbox Live)'}
                          </h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Connected
                          </span>
                        </div>
                        <p className="text-xs text-emerald-300 font-medium mt-1 flex items-center gap-1.5">
                          <Gamepad2 className="w-3.5 h-3.5" />
                          {currentIntegration.gamesCount} Xbox Titles Cataloged
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDisconnect('xbox')}
                      className="px-3 py-1.5 rounded bg-red-950/40 hover:bg-red-900/60 border border-red-700/50 text-red-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      Disconnect
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-steam-subtext">
                      Sync Method:{' '}
                      <span className="text-white font-medium">Xbox Live Cloud Sync</span> (No Xbox app required)
                    </div>
                    <button
                      onClick={() => handleConnectXbox()}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                      {isSubmitting ? 'Syncing...' : 'Sync Xbox Library'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Connection Form */
                <form onSubmit={handleConnectXbox} className="bg-[#16202d] border border-steam-border rounded-lg p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">Xbox Live Account Connect</h3>
                      <p className="text-xs text-steam-subtext mt-0.5">
                        Sync Xbox PC titles, achievements, and Game Pass entitlements.
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-800 text-gray-400 border border-gray-700">
                      Not Connected
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white mb-1.5">
                      Xbox Gamertag
                    </label>
                    <input
                      type="text"
                      value={xboxInput}
                      onChange={(e) => setXboxInput(e.target.value)}
                      placeholder="e.g. SpaceCadet85"
                      className="w-full px-3 py-2 bg-[#121922] border border-steam-border rounded text-sm text-white placeholder-steam-subtext/60 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleQuickConnectXbox}
                      className="px-3.5 py-2 rounded bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700/50 text-emerald-200 text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      Quick Connect SpaceCadet (Xbox Live)
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      {isSubmitting ? 'Connecting...' : 'Connect Xbox Account'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-steam-border/60 bg-[#16202d] flex items-center justify-between text-xs text-steam-subtext">
          <div className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Credentials are securely saved in your browser localStorage</span>
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
