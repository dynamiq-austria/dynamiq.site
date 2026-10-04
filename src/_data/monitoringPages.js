import monitoringDe from './monitoring.json' with { type: 'json' };
import monitoringEn from './monitoring_en.json' with { type: 'json' };

export default [
  {
    lang: 'de',
    permalink: '/monitoring/',
    alternatePage: '/en/monitoring/',
    anchors: { process: 'prozess', sources: 'quellen', contact: 'kontakt' },
    content: monitoringDe
  },
  {
    lang: 'en',
    permalink: '/en/monitoring/',
    alternatePage: '/monitoring/',
    anchors: { process: 'process', sources: 'sources', contact: 'contact' },
    content: monitoringEn
  }
];
