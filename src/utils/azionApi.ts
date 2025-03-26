
import { toast } from 'sonner';
import { DnsRecord, formatRecordsForAzion } from './dnsParser';

interface ImportConfig {
  apiKey: string;
  zoneId?: string;
  onProgress?: (progress: number, importedCount: number) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

/**
 * Imports DNS records to Azion API
 * @param records DNS records to import
 * @param config Import configuration
 * @returns Promise resolving to success status
 */
export const importRecordsToAzion = async (
  records: DnsRecord[],
  config: ImportConfig
): Promise<boolean> => {
  try {
    if (!config.apiKey) {
      throw new Error('API Key não fornecida');
    }
    
    const azionRecords = formatRecordsForAzion(records);
    let zoneId = config.zoneId;
    let successCount = 0;
    
    // If no zoneId is provided, try to determine from records
    if (!zoneId) {
      const soaRecord = records.find(r => r.type === 'SOA');
      if (soaRecord) {
        // Try to find zone by name
        try {
          zoneId = await findZoneByName(soaRecord.name, config.apiKey);
        } catch (error) {
          console.log('Could not find zone, will try to create one');
        }
      }
      
      // If still no zoneId, create a new zone
      if (!zoneId) {
        const domainName = getApexDomain(records);
        if (domainName) {
          try {
            zoneId = await createZone(domainName, config.apiKey);
            toast.success(`Zona "${domainName}" criada com sucesso`);
          } catch (error) {
            throw new Error(`Não foi possível criar zona: ${(error as Error).message}`);
          }
        } else {
          throw new Error('Não foi possível determinar o domínio principal');
        }
      }
    }
    
    // Process records in chunks to avoid overwhelming the API
    const chunks = chunkArray(azionRecords, 10);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Process each record in the chunk
      const results = await Promise.allSettled(
        chunk.map(record => addDnsRecord(record, zoneId as string, config.apiKey))
      );
      
      // Count successful records
      const chunkSuccessCount = results.filter(r => r.status === 'fulfilled').length;
      successCount += chunkSuccessCount;
      
      // Update progress
      if (config.onProgress) {
        const progress = Math.min(100, (successCount / azionRecords.length) * 100);
        config.onProgress(progress, successCount);
      }
      
      // If all failed in this chunk, consider stopping
      if (chunkSuccessCount === 0 && i > 0) {
        console.error('All records in chunk failed, possible API issue');
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    if (successCount === 0) {
      throw new Error('Nenhum registro foi importado com sucesso');
    }
    
    if (successCount < azionRecords.length) {
      toast.warning(`Atenção: Apenas ${successCount} de ${azionRecords.length} registros foram importados com sucesso`);
    } else {
      toast.success(`Todos os ${successCount} registros foram importados com sucesso`);
    }
    
    if (config.onComplete) {
      config.onComplete();
    }
    
    return true;
  } catch (error) {
    const errorMessage = (error as Error).message || 'Erro desconhecido ao importar registros';
    console.error('Import error:', error);
    
    if (config.onError) {
      config.onError(errorMessage);
    }
    
    toast.error(errorMessage);
    return false;
  }
};

/**
 * Adds a single DNS record to Azion
 */
const addDnsRecord = async (record: any, zoneId: string, apiKey: string): Promise<any> => {
  // This is a simulation in this example
  // In a real implementation, this would make an actual API call
  
  // Simulate API call
  console.log(`[API] Adding record to zone ${zoneId}:`, record);
  
  // Simulate random success/failure and network delay
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 300));
  
  // In a real implementation, this would be:
  /*
  const response = await fetch(`https://api.azion.com/zones/${zoneId}/records`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(record)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `API error: ${response.status}`);
  }
  
  return await response.json();
  */
  
  // For now, simulate success
  if (Math.random() > 0.1) { // 90% success rate for simulation
    return { id: Math.floor(Math.random() * 10000), ...record };
  } else {
    throw new Error('Simulated API error');
  }
};

/**
 * Finds a zone by name in Azion
 */
const findZoneByName = async (name: string, apiKey: string): Promise<string> => {
  // This is a simulation
  console.log(`[API] Looking for zone with name: ${name}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // In a real implementation, we would search the zones
  /*
  const response = await fetch(`https://api.azion.com/zones?name=${encodeURIComponent(name)}`, {
    method: 'GET',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json();
  if (data.results && data.results.length > 0) {
    return data.results[0].id;
  }
  */
  
  // For simulation, return null to simulate zone not found
  throw new Error('Zone not found');
};

/**
 * Creates a new zone in Azion
 */
const createZone = async (domainName: string, apiKey: string): Promise<string> => {
  // This is a simulation
  console.log(`[API] Creating zone for domain: ${domainName}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In a real implementation, we would create the zone
  /*
  const response = await fetch('https://api.azion.com/zones', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      name: domainName,
      domain: domainName
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.id;
  */
  
  // For simulation, return a random ID
  return String(Math.floor(Math.random() * 10000));
};

/**
 * Gets the apex domain from records
 */
const getApexDomain = (records: DnsRecord[]): string => {
  // Try to find SOA record first
  const soaRecord = records.find(r => r.type === 'SOA');
  if (soaRecord) {
    return soaRecord.name;
  }
  
  // Try to find NS records
  const nsRecords = records.filter(r => r.type === 'NS');
  if (nsRecords.length > 0) {
    return nsRecords[0].name;
  }
  
  // Try to extract from A or AAAA records
  const aRecords = records.filter(r => r.type === 'A' || r.type === 'AAAA');
  if (aRecords.length > 0) {
    // Find the shortest name which is likely the apex
    let shortest = aRecords[0].name;
    aRecords.forEach(r => {
      if (r.name.length < shortest.length) {
        shortest = r.name;
      }
    });
    return shortest;
  }
  
  return '';
};

/**
 * Utility to chunk an array into smaller arrays
 */
const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};
