import React, { useEffect, useState } from 'react';

export default function Popup() {
  const [queries, setQueries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    loadQueries();
  }, []);

  const loadQueries = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const url = tab?.url || '';
      const tabId = tab?.id;

      if (!tabId) {
        setError('Could not get current tab');
        setLoading(false);
        return;
      }

      // Extract conversation ID from URL
      const match = url.match(/chatgpt\.com\/c\/([a-f0-9-]+)/);
      if (!match) {
        setError('Not on a ChatGPT conversation page');
        setLoading(false);
        return;
      }

      const convId = match[1];

      // Execute fetch in the page context with proper auth
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: fetchConversationWithAuth,
        args: [convId]
      });

      if (results && results[0]?.result) {
        const { success, data, error: fetchError } = results[0].result;
        if (success && data) {
          const extractedQueries = extractSearchQueries(data);
          setQueries(extractedQueries);
        } else {
          setError(fetchError || 'Failed to fetch conversation');
        }
      } else {
        setError('Failed to execute script');
      }
    } catch {
      setError('Failed to fetch conversation data');
    } finally {
      setLoading(false);
    }
  };

  // Recursively extract all search_model_queries from the response
  const extractSearchQueries = (data: unknown, results: string[] = []): string[] => {
    if (!data || typeof data !== 'object') return results;

    if (Array.isArray(data)) {
      for (const item of data) {
        extractSearchQueries(item, results);
      }
    } else {
      const obj = data as Record<string, unknown>;

      // Check for search_model_queries object
      if (obj.type === 'search_model_queries' && Array.isArray(obj.queries)) {
        for (const query of obj.queries) {
          if (typeof query === 'string' && !results.includes(query)) {
            results.push(query);
          }
        }
      }

      for (const value of Object.values(obj)) {
        extractSearchQueries(value, results);
      }
    }

    return results;
  };

  const copyAllQueries = async () => {
    const text = queries.join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyQuery = async (query: string, index: number) => {
    await navigator.clipboard.writeText(query);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  // About overlay
  const AboutOverlay = () => (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 m-4 max-w-[300px]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">About</h2>
          <button
            onClick={() => setShowAbout(false)}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="text-center">
          <p className="text-gray-300 text-sm mb-4">
            Ahmet Yigit Budak &copy; {new Date().getFullYear()}
          </p>

          <div className="flex justify-center gap-4">
            <a
              href="https://github.com/yibudak"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
              </svg>
              GitHub
            </a>
            <a
              href="https://linkedin.com/in/yibudak"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="w-full min-h-[200px] bg-gray-900 text-white p-6 flex items-center justify-center">
        <span className="text-gray-400 text-base">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-[200px] bg-gray-900 text-white p-6 flex flex-col items-center justify-center relative">
        {showAbout && <AboutOverlay />}
        <button
          onClick={() => setShowAbout(true)}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-300"
          title="About"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="text-gray-300 text-base text-center">{error}</span>
        <p className="text-gray-500 text-sm mt-3 text-center">
          Open a ChatGPT conversation to extract search queries
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-900 text-white flex flex-col relative">
      {showAbout && <AboutOverlay />}

      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h1 className="font-semibold text-base">ChatGPT Search Query</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAbout(true)}
              className="p-1.5 text-gray-500 hover:text-gray-300"
              title="About"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              onClick={loadQueries}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Queries List */}
      <div className="overflow-auto p-4 max-h-[350px]">
        {queries.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-gray-400">
            <svg className="w-12 h-12 mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-base">No search queries found</p>
            <p className="text-sm text-gray-500 mt-2 text-center">
              Chat about products to generate queries
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {queries.map((query, index) => (
              <li
                key={index}
                onClick={() => copyQuery(query, index)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  copiedIndex === index
                    ? 'bg-green-600/20 border border-green-500/50'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
                title="Click to copy"
              >
                <div className="flex items-start gap-2">
                  <span className="text-blue-400 text-sm font-medium">{index + 1}.</span>
                  <span className="text-sm text-gray-100 leading-relaxed flex-1">{query}</span>
                  {copiedIndex === index && (
                    <span className="text-green-400 text-xs font-medium">Copied!</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      {queries.length > 0 && (
        <div className="p-4 border-t border-gray-700 flex items-center justify-between">
          <span className="text-sm text-gray-400">{queries.length} queries</span>
          <button
            onClick={copyAllQueries}
            className={`px-4 py-2 rounded text-sm font-medium ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {copied ? 'Copied!' : 'Copy All'}
          </button>
        </div>
      )}
    </div>
  );
}

// This function runs in the page context
async function fetchConversationWithAuth(conversationId: string): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    // Try to get the access token from ChatGPT's session
    // Method 1: Get token from the session API (how ChatGPT does it internally)
    let accessToken: string | null = null;

    try {
      const sessionResponse = await fetch('https://chatgpt.com/api/auth/session', {
        credentials: 'include'
      });
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        accessToken = sessionData.accessToken;
      }
    } catch {
      // Session API not available
    }

    // Method 2: Try to find token in __NEXT_DATA__
    if (!accessToken) {
      const nextData = (window as any).__NEXT_DATA__;
      if (nextData?.props?.pageProps?.accessToken) {
        accessToken = nextData.props.pageProps.accessToken;
      }
    }

    // Method 3: Check localStorage/sessionStorage
    if (!accessToken) {
      accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    }

    if (!accessToken) {
      return { success: false, error: 'Could not find access token. Please refresh the page.' };
    }

    // Fetch conversation with proper authorization
    const response = await fetch(`https://chatgpt.com/backend-api/conversation/${conversationId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
