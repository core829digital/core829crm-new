/**
 * Cataloghi condivisi (backend + interfaccia): categorie di lavoro CORE829 e categorie/nicchie dei clienti.
 * Nessun import: si puo' usare ovunque.
 */

export const serviceCategories: Record<string, string[]> = {
  "Software Development": [
    "Web Application", "Mobile App (iOS)", "Mobile App (Android)",
    "API Development", "Database Design & Architecture",
    "Cloud Migration & Infrastructure", "DevOps & CI/CD Setup",
    "Code Audit & Refactoring", "UI/UX Design & Prototyping",
    "E-commerce Platform", "CMS Development", "Custom CRM Development",
    "SaaS Platform Development", "Blockchain / DLT Solution",
    "Smart Contract Development", "QA & Automated Testing",
    "Security Audit & Penetration Testing",
    "Legacy System Migration", "Microservices Architecture",
    "Real-time System (WebSocket/SSE)",
    "Website Design & Development", "Landing Page", "Booking / Reservation System",
    "Client Portal / Dashboard", "Integrations & Automation (Zapier/Make/API)",
  ],
  "Marketing Services": [
    "SEO Optimization", "PPC Campaign Management",
    "Social Media Management", "Content Marketing Strategy",
    "Email Marketing & Automation", "Brand Strategy & Identity",
    "Market Research & Analysis", "Conversion Rate Optimization",
    "Marketing Automation Setup", "Influencer Marketing",
    "Video Production & Editing", "Copywriting & Content Creation",
    "PR & Communications", "Analytics & Reporting Dashboard",
    "Growth Strategy Consulting", "Local SEO / Google Business Profile",
    "Meta Ads (Facebook/Instagram)", "Google Ads", "TikTok Ads",
    "Lead Generation & Outreach", "Reputation & Review Management",
  ],
  "AI Services": [
    "Custom AI Model Development", "Chatbot / Conversational AI",
    "Data Pipeline & ETL Engineering", "NLP / Text Analytics Solution",
    "Computer Vision System", "RAG (Retrieval Augmented Generation)",
    "AI Consulting & Strategy", "ML Ops & Model Deployment",
    "Predictive Analytics Engine", "Recommendation System",
    "Document Intelligence (OCR/Extraction)",
    "Voice AI / Speech Recognition", "AI Workflow Automation", "AI Content Generation",
  ],
  "Event Digital Services": [
    "Event Photography (Photoshooting)", "Event Filmmaking / Videography",
    "Highlight Video / Aftermovie", "Live Streaming", "Drone Photo & Video",
    "Photo Booth / Digital Gallery", "Event Website & Registration",
    "Ticketing & QR / NFC Check-in", "Event App", "Social Media Event Coverage",
    "Wedding Photo & Video", "Corporate Event Coverage", "Product / Fashion Photoshooting",
    "Real Estate Photo & Video", "Photo & Video Post-production",
  ],
  "Hosting & Infrastructure": [
    "Web Hosting", "Managed Server", "VPS / Cloud Server Setup", "Domain Registration & Renewal",
    "Business Email Hosting", "SSL & Security Hardening", "Backup & Disaster Recovery",
    "Monitoring & Uptime", "Maintenance & Support Plan", "Server Migration",
  ],
  "Design & Creative": [
    "Logo & Visual Identity", "Graphic Design", "Motion Graphics", "Packaging Design",
    "Presentation / Pitch Deck", "Print Materials", "3D Rendering & Visualization", "Photo Retouching",
  ],
};

/** Categorie dei clienti (settore) con le nicchie. */
export const clientCategories: Record<string, string[]> = {
  "Events & Entertainment": [
    "Event agency", "Wedding planner", "Concert / festival organizer", "Nightclub / lounge", "DJ / band / artist",
    "Event venue / location", "Event catering", "Photographer", "Videographer / production house", "Theater / cinema", "Trade show / expo organizer",
  ],
  "Hospitality & Food": [
    "Restaurant", "Bar / cafe", "Hotel", "B&B / guest house", "Resort / villa", "Catering", "Bakery / pastry", "Butcher / deli", "Winery / brewery", "Food producer", "Food delivery / ghost kitchen",
  ],
  "Retail & E-commerce": [
    "Fashion / apparel", "Hardware store", "Jewelry / watches", "Cosmetics / perfumery", "Electronics", "Furniture / home decor", "Grocery / supermarket", "Online store", "Gifts / flowers", "Sports shop", "Wholesale / distribution",
  ],
  "Health & Wellness": [
    "Medical clinic", "Dental clinic", "Aesthetic clinic / medspa", "Beauty salon / barber", "Spa / wellness center", "Gym / fitness studio", "Physiotherapy / rehab", "Psychology / coaching", "Veterinary", "Pharmacy / parapharmacy", "Nutrition / dietitian",
  ],
  "Real Estate & Construction": [
    "Real estate agency", "Property developer", "Architect / engineering studio", "Interior design", "Construction company", "Renovation / contractor", "Property management", "Building materials", "Home services (plumbing, electrical, HVAC)",
  ],
  "Professional Services": [
    "Law firm", "Accounting / tax advisor", "Business consulting", "Notary", "HR / recruiting", "Insurance agency", "Translation / language services", "Marketing agency", "Training / consulting",
  ],
  "Technology": [
    "SaaS company", "Software house / IT services", "Startup", "Telecom / ISP", "Cybersecurity", "Fintech", "Crypto / Web3", "Hardware / IoT",
  ],
  "Education & Training": [
    "School / kindergarten", "University / academy", "Online courses / e-learning", "Language school", "Driving school", "Music / arts school", "Sports academy", "Tutoring",
  ],
  "Automotive & Transport": [
    "Car dealer", "Auto repair / body shop", "Car rental", "Logistics / freight", "Taxi / transfer / NCC", "Motorbike / bicycle", "Tires / parts", "Boat / yacht",
  ],
  "Industry & Manufacturing": [
    "Manufacturing", "Machinery / equipment", "Packaging / printing", "Energy / solar / utilities", "Chemicals / plastics", "Textile", "Wood / metalworking", "Waste / recycling",
  ],
  "Agriculture & Environment": ["Farm / agribusiness", "Greenhouse / nursery", "Agritourism", "Landscaping / gardening", "Environmental services"],
  "Finance & Banking": ["Bank / credit", "Investment / wealth", "Payments", "Leasing / loans", "Crowdfunding"],
  "Tourism & Travel": ["Travel agency", "Tour operator / guide", "Camping / outdoor", "Ski / mountain", "Diving / water sports", "Attractions / museums"],
  "Media & Publishing": ["Publisher / magazine", "Radio / TV", "Podcast / content creator", "Influencer / personal brand", "Printing house"],
  "Sports & Recreation": ["Sports club", "Sports event organizer", "Golf / tennis club", "Equestrian", "Gaming / esports", "Amusement / kids"],
  "Non-profit & Public": ["NGO / association", "Foundation", "Religious organization", "Public authority / municipality", "Healthcare institution", "Chamber of commerce"],
  "Other": ["Other"],
};

export const projectStatuses = ["Active", "On-Hold", "Completed", "Cancelled"] as const;
