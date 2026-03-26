
import { Dataset, ValidationStatus, ValidationReport, IngestionStatus, PreviewRow } from '../types';
import { fetchDatasets } from '../services/dataFetcher';

/**
 * Section 7: Frontend Mock Preview & Validation Layer
 * 
 * This service provides a frontend simulation of data validation and preview extraction.
 * It is not a production ETL pipeline; it exists purely to demonstrate UI capabilities
 * for metadata reporting and data previews.
 */

// Simulated delay to mimic network requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class MockDatasetPreviewService {
  
  /**
   * INGESTION PREVIEW: Fetches mock catalog data and runs a client-side validation check.
   */
  static async validateCatalog(): Promise<Dataset[]> {
    await delay(800); // Simulate API latency
    
    // Simulate raw fetch
    const rawData = await fetchDatasets();

    // Transformation & Validation Pass
    const processedData = rawData.map(dataset => {
      const validationReport = this.validateSchema(dataset);
      return {
        ...dataset,
        validationReport,
        ingestionStatus: validationReport.status === ValidationStatus.ERROR 
          ? IngestionStatus.FAILED 
          : IngestionStatus.COMPLETED
      };
    });

    return processedData;
  }

  /**
   * VALIDATION: Checks dataset against the defined schema and business rules.
   */
  static validateSchema(dataset: Dataset): ValidationReport {
    const issues: string[] = [];
    
    // Rule 1: Required Fields
    if (!dataset.id) issues.push('Missing ID');
    if (!dataset.title) issues.push('Missing Title');
    if (!dataset.source) issues.push('Missing Source Authority');

    // Rule 2: Data Freshness (Warning if > 5 years old)
    const updateDate = new Date(dataset.lastUpdated);
    const now = new Date();
    const ageInYears = (now.getTime() - updateDate.getTime()) / (1000 * 3600 * 24 * 365);
    
    if (ageInYears > 5) {
      issues.push(`Data is ${Math.floor(ageInYears)} years old (Depreciated)`);
    }

    // Rule 3: Source Verification (Simulated trusted list)
    const TRUSTED_AGENCIES = ['Bureau of Statistics', 'Guyana Lands and Surveys Commission', 'GGMC', 'Protected Areas Commission'];
    const isTrusted = TRUSTED_AGENCIES.some(agency => dataset.source.includes(agency));
    
    if (!isTrusted) {
      issues.push('Source not in Trusted Agency Registry');
    }

    // Determine Status
    let status = ValidationStatus.VERIFIED;
    if (issues.length > 0) {
      status = issues.some(i => i.startsWith('Missing')) ? ValidationStatus.ERROR : ValidationStatus.WARNING;
    }

    return {
      status,
      issues,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * EXTRACTION: Simulates parsing the raw file to return a preview snippet.
   * In a real app, this would parse the actual CSV/GeoJSON file.
   */
  static async generateMockPreview(dataset: Dataset): Promise<PreviewRow[]> {
    await delay(400); // Simulate file read time

    if (dataset.format === 'CSV') {
      return [
        { Region: 'Region 1', Population: 27643, Households: 5400, Growth: '+2.1%' },
        { Region: 'Region 2', Population: 46810, Households: 11200, Growth: '+1.5%' },
        { Region: 'Region 3', Population: 107495, Households: 28900, Growth: '+3.4%' },
        { Region: 'Region 4', Population: 313429, Households: 89000, Growth: '+5.1%' },
      ];
    }

    if (dataset.format === 'GeoJSON') {
      return [
        { id: '1', type: 'Feature', properties: { name: 'Zone A', area_sqkm: 450.2, type: 'Dense Forest' } },
        { id: '2', type: 'Feature', properties: { name: 'Zone B', area_sqkm: 120.5, type: 'Wetland' } },
        { id: '3', type: 'Feature', properties: { name: 'Zone C', area_sqkm: 890.1, type: 'Savannah' } },
      ];
    }

    return [{ info: 'Preview not available for this format.' }];
  }
}
