import type {ReactNode} from 'react';
import type {Metadata} from 'next';
import {catalogRows,pageMetadata} from '@/lib/seo';
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{
 const {id}=await params;
 if(!/^\d+$/.test(id))return {title:'Product unavailable',robots:{index:false,follow:true}};
 const rows=await catalogRows<{name_en:string;name_ar:string|null;description_en:string|null;description_ar:string|null}>('supplier_products',{id:`eq.${id}`,status:'eq.approved',select:'name_en,name_ar,description_en,description_ar',limit:'1'});
 if(!rows[0])return {title:'Product unavailable',robots:{index:false,follow:true}};
 const p=rows[0];const title=p.name_en||p.name_ar||'Medical product';
 const description=(p.description_en||p.description_ar||`${title} — product details and enquiries through Health Nations.`).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').slice(0,160);
 return pageMetadata(title,description,`/store/product/${id}`);
}
export default function Layout({children}:{children:ReactNode}){return children;}
