import React from 'react';
import { MapPin, Building2, Award, Users, AlertTriangle, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import type { LocalSEOAnalysis, BusinessLocation, CitationSource } from '../services/localSeo';

interface LocalSEODashboardProps {
  analysis: LocalSEOAnalysis;
  business: BusinessLocation;
}

const CitationSourceCard: React.FC<{ source: CitationSource }> = ({ source }) => {
  const getStatusIcon = () => {
    switch (source.status) {
      case 'accurate':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'inaccurate':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'missing':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">{source.name}</h4>
        {getStatusIcon()}
      </div>
      <p className="text-sm text-gray-600 mb-2">Importance: {source.importance}/10</p>
      {source.url && (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          View Listing →
        </a>
      )}
    </div>
  );
};

const LocalSEODashboard: React.FC<LocalSEODashboardProps> = ({ analysis, business }) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold">Business Information</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Accuracy Score</p>
              <div className="flex items-center gap-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${analysis.businessInfo.accuracy}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{analysis.businessInfo.accuracy}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Suggestions</p>
              <ul className="space-y-2">
                {analysis.businessInfo.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold">Citation Overview</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Total Citations</p>
              <p className="text-2xl font-semibold">{analysis.citations.total}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Accuracy Rate</p>
              <p className="text-2xl font-semibold">
                {((analysis.citations.accurate / analysis.citations.total) * 100).toFixed(0)}%
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm">{analysis.citations.accurate} Accurate</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span className="text-sm">{analysis.citations.inaccurate} Inaccurate</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm">{analysis.citations.missing} Missing</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-6">
          <Award className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold">Local Ranking Factors</h3>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-green-600 mb-2">Strengths</h4>
            <ul className="space-y-2">
              {analysis.localRankingFactors.strengths.map((strength, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {strength}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-yellow-600 mb-2">Weaknesses</h4>
            <ul className="space-y-2">
              {analysis.localRankingFactors.weaknesses.map((weakness, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  {weakness}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-purple-600 mb-2">Opportunities</h4>
            <ul className="space-y-2">
              {analysis.localRankingFactors.opportunities.map((opportunity, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <Award className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                  {opportunity}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold">Competitor Analysis</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Top Competitors</p>
              <ul className="space-y-2">
                {analysis.competitorAnalysis.topCompetitors.map((competitor, index) => (
                  <li key={index} className="text-sm text-gray-600">{competitor}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Unique Selling Points</p>
              <ul className="space-y-2">
                {analysis.competitorAnalysis.uniqueSellingPoints.map((point, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                    <Award className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Citation Sources</h3>
          <div className="grid grid-cols-2 gap-4">
            {analysis.citations.sources.map((source) => (
              <CitationSourceCard key={source.domain} source={source} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalSEODashboard;