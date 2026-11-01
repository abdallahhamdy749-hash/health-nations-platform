import type {Metadata} from 'next';
export const SITE_URL='https://healthnationsplat.com';
const publisher=(process.env.GOOGLE_ADSENSE_PUBLISHER_ID??'').trim();
export const ADSENSE_ID=/^ca-pub-\d{16}$/.test(publisher)?publisher:'';
export function pageMetadata(title:string,description:string,path:string):Metadata{
 return {title,description,alternates:{canonical:SITE_URL+path},openGraph:{title,description,url:SITE_URL+path,type:'website',siteName:'Health Nations'},twitter:{card:'summary',title,description}};
}
// Public catalog access only. A server secret must never be used for SEO queries.
export async function catalogRows<T>(table:'supplier_products'|'supplier_profiles',params:Record<string,string>):Promise<T[]>{
 const base=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!base||!key)throw new Error('Public catalog configuration is missing');
 const url=new URL(`/rest/v1/${table}`,base);
 for(const [k,v] of Object.entries(params))url.searchParams.set(k,v);
 const response=await fetch(url,{headers:{apikey:key,...(key.startsWith("eyJ")?{Authorization:`Bearer ${key}`}:{})},next:{revalidate:3600}});
 if(!response.ok)throw new Error('Public catalog is temporarily unavailable');
 return response.json() as Promise<T[]>;
}
