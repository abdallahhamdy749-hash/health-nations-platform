import type {ReactNode} from 'react';
import type {Metadata} from 'next';
import {catalogRows,pageMetadata} from '@/lib/seo';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const {slug}=await params;
 const rows=await catalogRows<{company_name_en:string|null;company_name_ar:string|null}>('supplier_profiles',{slug:`eq.${slug}`,status:'eq.approved',select:'company_name_en,company_name_ar',limit:'1'});
 if(!rows[0])return {title:'Supplier unavailable',robots:{index:false,follow:true}};
 const name=rows[0].company_name_en||rows[0].company_name_ar||'Medical supplier';
 return pageMetadata(name,`${name}: browse medical products and contact Health Nations for enquiries.`,`/store/${encodeURIComponent(slug)}`);
}
export default function Layout({children}:{children:ReactNode}){return children;}
