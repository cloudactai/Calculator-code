// Ported from Report-Generation (frontend/src/components/connectClio.jsx).
// Step 2 of the two-step setup wizard ("System Sync" — connect Clio & QBO).
// Adapted for CRA + react-router-dom v5 (useHistory; process.env).
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useHistory } from "react-router-dom";
import { apiPath } from "./apiUrls";
import cloudactLogo from "../../assets/images/cloudact-logo.svg";
import { SignOutIcon, SyncIcon, UserIcon } from "./profileActionIcons";
import "./connectClio.css";

export default function ConnectClio() {
    const history = useHistory();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [statusError, setStatusError] = useState("");
    const [actionMessage, setActionMessage] = useState("");
    const [status, setStatus] = useState({
        clioConnected: false,
        qboConnected: false,
        bothConnected: false,
        clioConnectedAt: null,
        qboConnectedAt: null
    });

    const oauthStatusUrl = apiPath(process.env.REACT_APP_API_BACKEND_URL_OAUTH_STATUS, "/api/oauth/status");
    const logoutUrl = apiPath(process.env.REACT_APP_API_BACKEND_URL_LOGOUT, "/api/logout");
    const backendOrigin = (() => {
        try {
            return new URL(oauthStatusUrl).origin;
        } catch {
            return "";
        }
    })();
    const connectClioUrl = `${backendOrigin}/oauth/clio/start`;
    const connectQboUrl = `${backendOrigin}/oauth/qbo/start`;
    const disconnectClioUrl = `${backendOrigin}/oauth/clio/disconnect`;
    const disconnectQboUrl = `${backendOrigin}/oauth/qbo/disconnect`;
    const callbackParams = new URLSearchParams(location.search || "");
    const callbackProvider = callbackParams.get("oauth");
    const callbackResult = callbackParams.get("result");
    const callbackMessage = callbackParams.get("message");

    async function loadStatus() {
        try {
            setLoading(true);
            const response = await fetch(oauthStatusUrl, {
                method: "GET",
                credentials: "include"
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                if (response.status === 401) {
                    history.push("/signIn");
                    return;
                }
                console.warn("OAuth status request failed:", data?.error || response.status);
                setStatus({
                    clioConnected: false,
                    qboConnected: false,
                    bothConnected: false,
                    clioConnectedAt: null,
                    qboConnectedAt: null
                });
                setStatusError("");
                return;
            }
            const nextStatus = {
                clioConnected: Boolean(data?.clioConnected),
                qboConnected: Boolean(data?.qboConnected),
                bothConnected: Boolean(data?.bothConnected),
                clioConnectedAt: data?.clioConnectedAt || null,
                qboConnectedAt: data?.qboConnectedAt || null
            };
            setStatus(nextStatus);
            setStatusError("");
            return nextStatus;
        } catch (err) {
            console.warn("OAuth status request failed:", err?.message || err);
            setStatus({
                clioConnected: false,
                qboConnected: false,
                bothConnected: false,
                clioConnectedAt: null,
                qboConnectedAt: null
            });
            setStatusError("");
        } finally {
            setLoading(false);
        }
        return null;
    }

    useEffect(() => {
        loadStatus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function startOauthFlow(endpoint, providerName) {
        const response = await fetch(endpoint, {
            method: "POST",
            credentials: "include"
        });
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
            history.push("/signIn");
            return;
        }
        if (!response.ok || !data?.authUrl) {
            alert(data?.error || `Failed to start ${providerName} connection`);
            return;
        }
        window.location.href = data.authUrl;
    }

    async function disconnectProvider(endpoint, providerName) {
        const response = await fetch(endpoint, {
            method: "POST",
            credentials: "include"
        });
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
            history.push("/signIn");
            return;
        }
        if (!response.ok) {
            alert(data?.error || `Failed to disconnect ${providerName}`);
            return;
        }
        setActionMessage(`${providerName} disconnected.`);
        await loadStatus();
    }

    async function signOut() {
        try {
            await fetch(logoutUrl, {
                method: "POST",
                credentials: "include"
            });
        } finally {
            history.replace("/signIn");
        }
    }

    async function refreshSystemSync() {
        const nextStatus = await loadStatus();
        setActionMessage(
            nextStatus?.bothConnected
                ? "System Sync status refreshed."
                : "Connect both Clio and QBO before running a full System Sync."
        );
    }

    const syncDots = useMemo(() => {
        if (loading) return ["pending", "pending", "pending", "pending", "pending", "pending"];
        if (status.bothConnected) return ["processed", "processed", "processed", "processed", "processed", "processed"];
        if (status.clioConnected || status.qboConnected) return ["processed", "pending", "pending", "pending", "pending", "pending"];
        return ["error", "error", "pending", "pending", "pending", "pending"];
    }, [loading, status.bothConnected, status.clioConnected, status.qboConnected]);

    const systemSyncLabel = loading
        ? "Checking connections"
        : status.bothConnected
            ? "System Sync Ready"
            : "Waiting for connections";

    return (
        <div className="sync-page">
            <button
                type="button"
                className="sync-page-close"
                onClick={() => history.push("/home")}
                aria-label="Return to home"
            ></button>
            <aside className="sync-sidebar" aria-label="System Sync navigation">
                <Link
                    to="/home"
                    className="sync-sidebar-logo-link"
                    aria-label="Go to home"
                >
                    <img src={cloudactLogo} alt="CloudAct" className="sync-sidebar-logo" />
                </Link>
                <nav className="sync-sidebar-nav">
                    <button type="button" onClick={() => history.push("/profile")}>
                        <UserIcon className="sync-sidebar-icon" />
                        <span>Profile</span>
                    </button>
                    <button type="button" className="is-active" onClick={() => history.push("/setupwizard/connect")}>
                        <SyncIcon className="sync-sidebar-icon" />
                        <span>System Sync</span>
                    </button>
                    <button type="button" onClick={signOut}>
                        <SignOutIcon className="sync-sidebar-icon" />
                        <span>Sign out</span>
                    </button>
                </nav>
            </aside>

            <main className="sync-main">
                <section className="sync-panel">
                    <div className="sync-panel-header">
                        <h1>System Sync</h1>
                        <button
                            type="button"
                            className="sync-panel-refresh"
                            onClick={refreshSystemSync}
                            disabled={loading}
                            aria-label="Refresh System Sync status"
                        >
                            <SyncIcon />
                        </button>
                    </div>

                    {callbackProvider && callbackResult === "success" ? (
                        <div className="sync-callback is-success">
                            Returned from {callbackProvider.toUpperCase()} authentication. Verifying connection status...
                        </div>
                    ) : null}
                    {callbackProvider && callbackResult === "error" ? (
                        <div className="sync-callback is-error">
                            {callbackProvider.toUpperCase()} connection failed{callbackMessage ? `: ${callbackMessage}` : "."}
                        </div>
                    ) : null}
                    {statusError ? <p className="sync-status-error">{statusError}</p> : null}
                    {actionMessage ? <p className="sync-action-message">{actionMessage}</p> : null}

                    <div className="sync-card-grid">
                        <ProviderSyncCard
                            provider="qbo"
                            connected={status.qboConnected}
                            connectedAt={status.qboConnectedAt}
                            loading={loading}
                            onConnect={() => startOauthFlow(connectQboUrl, "QBO")}
                            onDisconnect={() => disconnectProvider(disconnectQboUrl, "QBO")}
                        />

                        <ProviderSyncCard
                            provider="clio"
                            connected={status.clioConnected}
                            connectedAt={status.clioConnectedAt}
                            loading={loading}
                            onConnect={() => startOauthFlow(connectClioUrl, "Clio")}
                            onDisconnect={() => disconnectProvider(disconnectClioUrl, "Clio")}
                        />

                        <SystemSyncCard
                            label={systemSyncLabel}
                            dots={syncDots}
                            loading={loading}
                            onRefresh={refreshSystemSync}
                        />
                    </div>
                </section>
            </main>
        </div>
    );
}

function formatConnectedAt(value) {
    if (!value) return "No connection recorded yet";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "No connection recorded yet";

    return new Intl.DateTimeFormat("en-CA", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
    }).format(date);
}

function ProviderSyncCard({ provider, connected, connectedAt, loading, onConnect, onDisconnect }) {
    const isQbo = provider === "qbo";
    const providerName = isQbo ? "QBO" : "Clio";
    const cardClass = isQbo ? "is-qbo" : "is-clio";
    const bgSrc = isQbo ? "/Rectangle%206347%20(1).svg" : "/Rectangle%206347.svg";
    const logoSrc = isQbo ? "/Group%20336.png" : "/Group%20340.svg";
    const statusLabel = connected
        ? `Connected To ${providerName}`
        : `${providerName} not Connected`;
    const cardAction = connected ? undefined : onConnect;

    return (
        <article
            className={`sync-provider-card ${cardClass}${connected ? " is-connected" : " is-disconnected"}`}
            role={cardAction ? "button" : undefined}
            tabIndex={cardAction ? 0 : undefined}
            onClick={cardAction}
            onKeyDown={(event) => {
                if (cardAction && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    cardAction();
                }
            }}
            aria-label={`${providerName} ${connected ? "connected" : "not connected"}`}
        >
            <img src={bgSrc} alt="" className="sync-provider-bg" aria-hidden="true" />
            <div className="sync-provider-content">
                <img src={logoSrc} alt={providerName} className="sync-provider-logo" />
                <div className="sync-provider-copy">
                    <strong>{loading ? "Checking..." : statusLabel}</strong>
                    <span>{formatConnectedAt(connectedAt)}</span>
                </div>
                <button
                    type="button"
                    className="sync-card-close"
                    disabled={loading || !connected}
                    onClick={(event) => {
                        event.stopPropagation();
                        if (connected) onDisconnect();
                    }}
                    aria-label={connected ? `Disconnect ${providerName}` : `${providerName} is not connected`}
                >
                    x
                </button>
                <button
                    type="button"
                    className="sync-card-refresh"
                    disabled={loading}
                    onClick={(event) => {
                        event.stopPropagation();
                        onConnect();
                    }}
                    aria-label={`${connected ? "Reconnect" : "Connect"} ${providerName}`}
                >
                    <SyncIcon />
                </button>
            </div>
        </article>
    );
}

function SystemSyncCard({ label, dots, loading, onRefresh }) {
    return (
        <article className="sync-system-card" aria-label="CloudAct System Sync status">
            <img src="/Rectangle%2034624213.svg" alt="" className="sync-system-bg" aria-hidden="true" />
            <div className="sync-system-title">
                <img src="/Group%20242366.svg" alt="System Sync" />
            </div>
            <div className="sync-system-copy">
                <strong>{label}</strong>
                <div className="sync-dot-row" aria-label="Latest sync status indicators">
                    {dots.map((dot, index) => (
                        <span
                            key={`${dot}-${index}`}
                            className={`sync-status-dot is-${dot}`}
                            title={`${dot === "processed" ? "Processed" : dot === "error" ? "Needs attention" : "Pending"} sync batch`}
                        />
                    ))}
                </div>
            </div>
            <button
                type="button"
                className="sync-card-close is-decorative"
                aria-label="System Sync card"
                disabled
            >
                x
            </button>
            <button
                type="button"
                className="sync-card-refresh"
                disabled={loading}
                onClick={onRefresh}
                aria-label="Refresh System Sync status"
            >
                <SyncIcon />
            </button>
        </article>
    );
}
