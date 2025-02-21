import { useState } from 'react';
import { Sparkles, PenTool, Send, Loader2, Palmtree, Crown, Wand2, BookOpen, BarChart2, Target } from 'lucide-react';
import { AIProvider, ContentType, generateContent, getBestProvider, crossCheckContent, CrossCheckResult } from './services/ai';
import ReactMarkdown from 'react-markdown';

function App() {
  const [prompt, setPrompt] = useState('');
  const [contentType, setContentType] = useState<ContentType>('blog');
  const [aiProvider, setAIProvider] = useState<AIProvider>('mistral');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [crossCheckResults, setCrossCheckResults] = useState<CrossCheckResult[]>([]);
  const [isCrossChecking, setIsCrossChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    
    setIsGenerating(true);
    setError(null);
    setCrossCheckResults([]);
    
    try {
      const content = await generateContent(prompt, contentType, aiProvider);
      setGeneratedContent(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Error generating content:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCrossCheck = async () => {
    if (!generatedContent) return;
    
    setIsCrossChecking(true);
    setError(null);
    
    try {
      const results = await crossCheckContent(prompt, contentType, generatedContent);
      setCrossCheckResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Error cross-checking content:', err);
    } finally {
      setIsCrossChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Palmtree className="w-10 h-10 text-white" />
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">QueerLuxe Travel AI</h1>
          <p className="text-xl text-white/80">Content Marketing Assistant</p>
        </header>

        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-4xl mx-auto">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as ContentType)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              >
                <option value="blog">Blog Post</option>
                <option value="social">Social Media</option>
                <option value="email">Email Campaign</option>
                <option value="description">Travel Description</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">AI Provider</label>
              <select
                value={aiProvider}
                onChange={(e) => setAIProvider(e.target.value as AIProvider)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              >
                <option value="mistral">Mistral AI (Precise & Efficient)</option>
                <option value="gemini">Google Gemini (Creative & Modern)</option>
                <option value="anthropic">Claude (Sophisticated & Detailed)</option>
                <option value="cohere">Cohere (Marketing & Persuasive)</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Brief
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the content you want to generate (e.g., 'Write a blog post about luxury LGBTQ+ friendly resorts in Bali')..."
              className="w-full h-32 rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            />
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Content
              </>
            )}
          </button>

          {generatedContent && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <PenTool className="w-5 h-5" />
                  Generated Content
                </h2>
                <button
                  onClick={handleCrossCheck}
                  disabled={isCrossChecking}
                  className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2"
                >
                  {isCrossChecking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cross-Checking...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Cross-Check with Other Models
                    </>
                  )}
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 prose max-w-none">
                <ReactMarkdown>{generatedContent}</ReactMarkdown>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(generatedContent)}
                className="mt-4 text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Copy to Clipboard
              </button>

              {crossCheckResults.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Cross-Check Analysis</h3>
                  <div className="grid gap-6">
                    {crossCheckResults.map((result) => (
                      <div key={result.provider} className="bg-gray-50 rounded-lg p-6">
                        <h4 className="font-semibold text-purple-600 mb-3 capitalize">{result.provider} Analysis</h4>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Tone</p>
                            <p className="text-gray-600">{result.analysis.tone}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Perspective</p>
                            <p className="text-gray-600">{result.analysis.perspective}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Unique Insights</p>
                            <ul className="list-disc list-inside text-gray-600">
                              {result.analysis.uniqueInsights.map((insight, index) => (
                                <li key={index}>{insight}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;