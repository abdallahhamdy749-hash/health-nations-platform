import type {MetadataRoute} from 'next';
import {SITE_URL,catalogRows} from '@/lib/seo';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const result:MetadataRoute.Sitemap=['','/store','/suppliers','/catalogs','/homecare','/import-request'].map(p=>({url:SITE_URL+p}));
 // Keyset pagination includes approved public catalog records without a 1,000-row cutoff.
 let last='0';
 for(;;){
  const rows=await catalogRows<{id:string|number}>('supplier_products',{select:'id',status:'eq.approved',id:`gt.${last}`,order:'id.asc',limit:'500'});
  for(const row of rows)result.push({url:`${SITE_URL}/store/product/${row.id}`});
  if(rows.length<500)break;
  last=String(rows[rows.length-1].id);
 }
 let offset=0;
 for(;;){
  const rows=await catalogRows<{slug:string|null}>('supplier_profiles',{select:'slug',status:'eq.approved',slug:'not.is.null',order:'user_id.asc',offset:String(offset),limit:'500'});
  for(const row of rows)if(row.slug)result.push({url:`${SITE_URL}/store/${encodeURIComponent(row.slug)}`});
  if(rows.length<500)break;offset+=500;
 }
 if(result.length>50000)throw new Error('Split the sitemap before exceeding 50,000 URLs');
 return result;
}
