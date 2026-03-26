
import React from 'react';

export const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gn-surface dark:bg-gn-surface-dark text-gn-foreground dark:text-gn-foreground-dark transition-colors duration-300">
      {/* Header Section */}
      <section className="bg-gn-surface-muted dark:bg-gn-surface-muted-dark border-b border-gn-border dark:border-gn-border-dark py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="text-guyana-gold font-mono text-xs uppercase tracking-widest mb-4 block">
            National Spatial Data Infrastructure
          </span>
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-gn-foreground dark:text-gn-foreground-dark mb-6">
            Bridging the Gap in <br/> Spatial Intelligence.
          </h1>
          <p className="text-xl text-gn-foreground-muted dark:text-gn-foreground-muted-dark max-w-2xl mx-auto leading-relaxed">
            GuyNode is a grassroots, open data initiative designed to democratize access to geospatial information and empower decision-makers across Guyana.
          </p>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        
        {/* The Problem & Solution */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20 border-b border-gn-border dark:border-gn-border-dark pb-12">
          <div className="md:col-span-4">
            <h2 className="text-2xl font-bold text-gn-foreground dark:text-gn-foreground-dark mb-4">The Challenge</h2>
            <div className="w-12 h-1 bg-guyana-red mb-6"></div>
          </div>
          <div className="md:col-span-8 space-y-6 text-gn-foreground-muted dark:text-gray-300 leading-relaxed">
            <p>
              Government websites for Guyana scarcely provide spatial data in GIS-ready formats to the public. Critical maps are often supplied only as static PDFs, JPGs, or TIFFs, which cannot be utilized for meaningful GIS analysis without significant, time-consuming geoprocessing.
            </p>
            <p>
              <strong className="text-gn-foreground dark:text-white">GuyNode is the grassroots response to this interoperability crisis.</strong>
            </p>
            <p>
              We systematically collect GIS layers and maps about Guyana, standardize them into open formats, and host them on a single, unified platform. Our mission is to ensure this data remains freely accessible to the entire geospatial community.
            </p>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20 border-b border-gn-border dark:border-gn-border-dark pb-12">
           <div className="md:col-span-4">
            <h2 className="text-2xl font-bold text-gn-foreground dark:text-gn-foreground-dark mb-4">Why GuyNode Matters</h2>
            <div className="w-12 h-1 bg-guyana-gold mb-6"></div>
          </div>
          <div className="md:col-span-8">
            <p className="text-gn-foreground-muted dark:text-gray-300 mb-8">
              Spatial data downloaded from the GuyNode portal serves as the foundational base layer for critical national activities. By standardizing access, we enable:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                "Academic Research & Education",
                "Infrastructure Monitoring",
                "Flood Management & Defense",
                "Disease Vector Mapping",
                "Crime Pattern Analysis",
                "Climate Vulnerability Assessments"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-gn-elevated dark:bg-white/5 p-4 rounded border border-gn-border dark:border-white/5">
                  <div className="w-2 h-2 rounded-full bg-bloom-accent"></div>
                  <span className="text-sm font-semibold text-gn-foreground dark:text-gray-200">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Sources */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20 border-b border-gn-border dark:border-gn-border-dark pb-12">
           <div className="md:col-span-4">
            <h2 className="text-2xl font-bold text-gn-foreground dark:text-gn-foreground-dark mb-4">Our Data Portfolio</h2>
            <div className="w-12 h-1 bg-guyana-green mb-6"></div>
          </div>
          <div className="md:col-span-8 space-y-6 text-gn-foreground-muted dark:text-gray-300">
            <p>
              We provide direct downloads or secure links to external repositories. All datasets stored on GuyNode are strictly <span className="text-gn-foreground dark:text-white font-semibold">Public Domain</span>.
            </p>
            <ul className="space-y-4 mt-6">
              <li className="flex flex-col gap-1">
                <span className="text-gn-foreground dark:text-white font-bold">Primary Datasets</span>
                <span className="text-sm text-gn-foreground-muted dark:text-gray-400">Administrative boundaries (RDCs, Municipalities, Villages), Digital Elevation Models (DEMs), Soils, Vegetation, Sea Defenses, and Forestry data.</span>
              </li>
              <li className="flex flex-col gap-1">
                <span className="text-gn-foreground dark:text-white font-bold">Trusted Sources</span>
                <span className="text-sm text-gn-foreground-muted dark:text-gray-400">Bureau of Statistics, Guyana Lands & Surveys Commission, Open Street Map, World Bank, FAO, and US Government Archives.</span>
              </li>
              <li className="flex flex-col gap-1">
                <span className="text-gn-foreground dark:text-white font-bold">Digitization Efforts</span>
                <span className="text-sm text-gn-foreground-muted dark:text-gray-400">Select shapefiles have been meticulously digitized from public-domain documents to preserve historical accuracy.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Stewardship & Maintenance */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20 border-b border-gn-border dark:border-gn-border-dark pb-12">
           <div className="md:col-span-4">
            <h2 className="text-2xl font-bold text-gn-foreground dark:text-gn-foreground-dark mb-4">Stewardship</h2>
            <div className="w-12 h-1 bg-bloom-accent mb-6"></div>
          </div>
          <div className="md:col-span-8 space-y-6 text-gn-foreground-muted dark:text-gray-300">
            <p>
              GuyNode is maintained by a dedicated project team committed to open data principles. We are not an official government entity but act as stewards for public-domain geospatial data.
            </p>
            <p>
              Updates are released incrementally to ensure stability. If you spot an error in the data or the platform, please help us improve by reporting it.
            </p>
            <a href="/?view=REPORT_ISSUE" className="inline-block text-bloom-accent font-bold hover:underline">
              Report an Issue →
            </a>
          </div>
        </div>

        {/* Privacy & Architecture (New) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20 border-b border-gn-border dark:border-gn-border-dark pb-12">
           <div className="md:col-span-4">
            <h2 className="text-2xl font-bold text-gn-foreground dark:text-gn-foreground-dark mb-4">Architecture & Privacy</h2>
            <div className="w-12 h-1 bg-gray-500 mb-6"></div>
          </div>
          <div className="md:col-span-8 space-y-4 text-gn-foreground-muted dark:text-gray-300">
            <p>
              Guynode is architected as a <strong>Static Front-End Portal</strong>. This means:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>No User Accounts:</strong> We do not maintain a user database. You do not need to log in to access public data.</li>
              <li><strong>No Personal Tracking:</strong> We do not store personal search history or usage profiles associated with individuals.</li>
              <li><strong>Client-Side Processing:</strong> Most data operations (filtering, basic visualization) happen directly in your browser.</li>
            </ul>
            <p className="text-sm italic mt-4">
              We focus on data availability, not data collection.
            </p>
          </div>
        </div>

        {/* Partnerships */}
        <div className="bg-gn-elevated dark:bg-gn-elevated-dark border border-gn-border dark:border-gn-border-dark rounded-lg p-8 md:p-12 text-center">
          <h2 className="text-3xl font-serif font-bold text-gn-foreground dark:text-gn-foreground-dark mb-6">Map Sharing Partnerships</h2>
          <p className="text-gn-foreground-muted dark:text-gray-300 max-w-2xl mx-auto mb-8">
            We are building a community. If you possess map layers pertaining to Guyana (Schools, Healthcare Facilities, Drainage, Rice Lands, etc.) and wish to share them with the public, we will host them with full attribution to you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-bloom-accent hover:bg-blue-600 text-white font-bold py-3 px-8 rounded transition-colors">
              Submit a Dataset
            </button>
            <button className="bg-transparent border border-gn-border dark:border-white/20 hover:border-gn-foreground dark:hover:border-white text-gn-foreground dark:text-white font-bold py-3 px-8 rounded transition-colors">
              Contact Us
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
