// API v1 routes organization
// All API routes should be under /api/v1 for versioning

export const API_ROUTES = {
  // Agencies
  agencies: "/api/v1/agencies",
  agenciesList: "/api/v1/agencies/list",
  agenciesStats: "/api/v1/agencies/stats",
  
  // Leads
  leads: "/api/v1/leads",
  leadsList: "/api/v1/leads/list",
  leadsStats: "/api/v1/leads/stats",
  leadsBulk: "/api/v1/leads/bulk",
  
  // Teams
  teams: "/api/v1/teams",
  teamsList: "/api/v1/teams/list",
  teamsStats: "/api/v1/teams/stats",
  teamsBulk: "/api/v1/teams/bulk",
  
  // Scraping
  scrape: "/api/v1/scraping/scrape",
  findyeloDownload: "/api/v1/scraping/findyello-download",
  gmapsScrape: "/api/v1/scraping/gmaps",
  
  // Data Tools
  addressVerification: "/api/v1/tools/address-verification",
  minnesotaTax: "/api/v1/tools/minnesota-tax",
  
  // Utilities
  export: "/api/v1/export",
  migrate: "/api/v1/migrate",
};
