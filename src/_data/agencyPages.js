import agencyDe from './agencies.json' with { type: 'json' };
import agencyEn from './agencies_en.json' with { type: 'json' };

export default [
  {
    lang: 'de',
    permalink: '/agenturen/',
    alternatePage: '/en/agencies/',
    anchors: { research: 'research', partnership: 'zusammenarbeit', process: 'ablauf', cases: 'einsatzfelder', contact: 'kontakt' },
    content: agencyDe
  },
  {
    lang: 'en',
    permalink: '/en/agencies/',
    alternatePage: '/agenturen/',
    anchors: { research: 'research', partnership: 'partnership', process: 'process', cases: 'use-cases', contact: 'contact' },
    content: agencyEn
  }
];
