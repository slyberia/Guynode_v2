import React from 'react';

export const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gn-surface dark:bg-gn-surface-dark text-gn-foreground dark:text-gn-foreground-dark transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-5xl font-serif font-bold mb-12 text-center text-gn-foreground dark:text-gn-foreground-dark">About GuyNode</h1>
        <div className="prose prose-lg dark:prose-invert max-w-none space-y-8 text-gn-foreground-muted dark:text-gn-foreground-muted-dark leading-relaxed">
          <p>
            GuyNode is a public-facing spatial data portal designed to improve access to geographic information about Guyana. It brings together datasets, mapping resources, tutorials, blog content, and supporting references in one place so that researchers, students, planners, developers, and the public can more easily explore, understand, and work with spatial data.
          </p>
          <p>
            The platform exists to reduce friction. Geographic information is often scattered across institutions, buried in archives, or presented in ways that are difficult for non-specialists to use. GuyNode helps close that gap by making data, context, and learning resources easier to discover and apply.
          </p>

          <h2 className="text-3xl font-bold mt-12 mb-6 text-gn-foreground dark:text-gn-foreground-dark">Our Mission</h2>
          <p>
            Our mission is to make Guyana’s spatial data more accessible, understandable, and usable.
          </p>
          <p>
            We believe geographic information should not be limited to technical specialists or locked behind fragmented systems. By improving access to maps, datasets, practical guidance, and contextual content, GuyNode supports stronger research, better planning, more informed public discussion, and broader participation in the use of spatial knowledge.
          </p>

          <h2 className="text-3xl font-bold mt-12 mb-6 text-gn-foreground dark:text-gn-foreground-dark">What You Can Find on GuyNode</h2>
          <p>
            GuyNode provides access to a growing collection of spatial datasets and mapping resources relevant to Guyana. These may include administrative boundaries, settlements, infrastructure, land use, environmental layers, imagery, elevation data, and other geospatial materials that support analysis and decision-making.
          </p>
          <p>
            The platform also includes tutorials, blog posts, and related academic or reference materials that help users interpret data, learn mapping concepts, and better understand the geographic, historical, and analytical context behind the information they are using.
          </p>
          <p>
            Where possible, datasets and resources are linked directly to their original or publicly accessible sources. In some cases, GuyNode also organizes, describes, or contextualizes materials so they are easier to discover and use.
          </p>

          <h2 className="text-3xl font-bold mt-12 mb-6 text-gn-foreground dark:text-gn-foreground-dark">Why It Matters</h2>
          <p>
            Spatial data plays an important role in understanding how places function and how they change over time. It supports work in planning, environmental management, education, disaster preparedness, infrastructure, public health, and historical research.
          </p>
          <p>
            But access alone is not enough. Many users also need explanation, guidance, and examples in order to use geographic information effectively. By combining data access with educational and contextual resources, GuyNode helps make spatial information more practical and approachable for both specialist and non-specialist audiences.
          </p>

          <h2 className="text-3xl font-bold mt-12 mb-6 text-gn-foreground dark:text-gn-foreground-dark">Data Sharing and Partnerships</h2>
          <p>
            GuyNode supports the broader visibility of spatial data resources created by public institutions, research groups, educators, and independent contributors. If you manage datasets, mapping resources, publications, or other materials relevant to Guyana and would like them referenced, linked, or made easier to discover through the platform, GuyNode can help extend their reach to a wider audience.
          </p>
          <p>
            The goal is not to replace source institutions, but to improve discoverability, access, and public usefulness across the wider data ecosystem.
          </p>

          <h2 className="text-3xl font-bold mt-12 mb-6 text-gn-foreground dark:text-gn-foreground-dark">Contact Information</h2>
          <p>
            For questions, corrections, dataset suggestions, resource recommendations, or partnership inquiries, please get in touch through the contact page or the email address provided on the site.
          </p>
        </div>
      </div>
    </div>
  );
};
