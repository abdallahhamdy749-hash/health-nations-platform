"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  Boxes,
  Download,
  Edit3,
  Eye,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  Upload,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ProductKind = "equipment" | "consumable" | "spare_part";

type ProductStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";

type ProductFields = {
  name_en: string;
  name_ar: string | null;
  product_kind: ProductKind | null;
  category: string | null;
  brand: string | null;
  model: string | null;
  part_number: string | null;
  manufacturer: string | null;
  compatible_device: string | null;
  part_condition: string | null;
  image_url: string | null;
  sale_price: number | null;
  currency: string | null;
  stock: number | null;
  available_for_sale: boolean | null;
  available_for_rental: boolean | null;
};

type Product = ProductFields & {
  id: number;
  supplier_id: string;
  status: ProductStatus | null;
  created_at: string | null;
};

type ImportRow = ProductFields & {
  product_kind: ProductKind;
  currency: string;
  available_for_sale: boolean;
  available_for_rental: boolean;
};

type Notice = {
  error: boolean;
  text: string;
};

const COLUMNS = [
  "name_en",
  "name_ar",
  "product_kind",
  "category",
  "brand",
  "model",
  "part_number",
  "manufacturer",
  "compatible_device",
  "part_condition",
  "image_url",
  "sale_price",
  "currency",
  "stock",
  "available_for_sale",
  "available_for_rental",
] as const;

const PRODUCT_SELECT = [
  "id",
  "supplier_id",
  ...COLUMNS,
  "status",
  "created_at",
].join(",");

const BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

const PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50";

const INPUT =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100";

export default function VendorProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const deleteLock = useRef(false);

  const loadProducts = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setLoadError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        setProducts([]);
        router.replace("/login");
        return false;
      }

      const { data, error } = await supabase
        .from("supplier_products")
        .select(PRODUCT_SELECT)
        .eq("supplier_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProducts((data ?? []) as unknown as Product[]);
      return true;
    } catch (error: unknown) {
      setLoadError(getErrorMessage(error, "تعذر تحميل المنتجات."));
      return false;
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !term ||
        [
          product.name_en,
          product.name_ar,
          product.category,
          product.brand,
          product.model,
          product.part_number,
          product.manufacturer,
          product.compatible_device,
          product.part_condition,
        ].some((value) => value?.toLowerCase().includes(term));

      return (
        matchesSearch &&
        (statusFilter === "all" ||
          (product.status ?? "draft") === statusFilter) &&
        (typeFilter === "all" ||
          normalizeKind(product.product_kind) === typeFilter)
      );
    });
  }, [products, search, statusFilter, typeFilter]);

  const stats = useMemo(
    () => ({
      total: products.length,
      approved: products.filter((p) => p.status === "approved").length,
      pending: products.filter((p) => p.status === "pending").length,
      parts: products.filter((p) => p.product_kind === "spare_part").length,
      empty: products.filter(
        (p) => p.stock !== null && Number(p.stock) === 0
      ).length,
    }),
    [products]
  );

  async function deleteProduct(product: Product) {
    if (deleteLock.current || !canDelete(product.status)) return;

    if (!window.confirm(`هل تريد حذف المنتج "${product.name_en}"؟`)) {
      return;
    }

    deleteLock.current = true;
    setDeletingId(product.id);
    setActionError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("supplier_products")
        .delete()
        .eq("id", product.id)
        .eq("supplier_id", user.id)
        .in("status", ["draft", "pending", "rejected"])
        .select("id");

      if (error) throw error;

      if (!data?.length) {
        throw new Error(
          "لم يتم حذف المنتج. راجع صلاحية الحذف أو حدّث القائمة."
        );
      }

      setProducts((current) =>
        current.filter((item) => item.id !== product.id)
      );
    } catch (error: unknown) {
      setActionError(getErrorMessage(error, "تعذر حذف المنتج."));
    } finally {
      deleteLock.current = false;
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto max-w-7xl">
        <button
          type="button"
          onClick={() => router.push("/vendor/dashboard")}
          className="mb-6 inline-flex items-center gap-2 font-bold text-slate-600 hover:text-blue-700"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        <header className="flex flex-col gap-5 rounded-3xl bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
              Global Vendor Dashboard
            </p>
            <h1 className="mt-1 text-3xl font-black">Products</h1>
            <p className="mt-2 text-slate-600">
              إدارة الأجهزة والمستهلكات وقطع الغيار والأسعار والمخزون.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => void loadProducts()}
              className={BUTTON}
            >
              <RefreshCw
                size={18}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => router.push("/vendor/products/new")}
              className={PRIMARY}
            >
              <Plus size={19} />
              Add Product | إضافة منتج
            </button>
          </div>
        </header>

        <BulkImport
          products={products}
          loading={loading}
          loadError={loadError}
          onRefresh={loadProducts}
        />

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total Products" value={stats.total} icon={<Package />} />
          <StatCard label="Approved" value={stats.approved} icon={<Eye />} />
          <StatCard label="Pending" value={stats.pending} icon={<Loader2 />} />
          <StatCard label="Spare Parts" value={stats.parts} icon={<Settings />} />
          <StatCard label="Out of Stock" value={stats.empty} icon={<Boxes />} />
        </section>

        <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px]">
            <label className="relative">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                aria-label="Search products"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Product, Part Number, Brand, Device..."
                className={`${INPUT} pl-12`}
              />
            </label>

            <select
              aria-label="Product type"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className={INPUT}
            >
              <option value="all">All Product Types</option>
              <option value="equipment">Medical Equipment</option>
              <option value="consumable">Medical Consumables</option>
              <option value="spare_part">Medical Spare Parts</option>
            </select>

            <select
              aria-label="Product status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={INPUT}
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </section>

        {(loadError || actionError) && (
          <Message error text={loadError || actionError} />
        )}

        <section className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-72 items-center justify-center gap-3">
              <Loader2 className="animate-spin text-blue-700" />
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-center">
              <Package size={40} className="text-blue-700" />
              <h2 className="text-2xl font-black">No products found</h2>
              <p className="text-slate-500">
                لا توجد منتجات مطابقة للبحث أو الفلاتر الحالية.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px] text-left">
                <thead className="bg-slate-50 text-sm text-slate-500">
                  <tr>
                    {[
                      "Product",
                      "Type",
                      "Part / Device",
                      "Category",
                      "Price",
                      "Stock",
                      "Status",
                      "Actions",
                    ].map((title) => (
                      <th key={title} className="px-5 py-4">
                        {title}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name_en}
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="text-slate-400" />
                            )}
                          </div>

                          <div>
                            <strong className="block">{product.name_en}</strong>
                            {product.name_ar && (
                              <span
                                dir="rtl"
                                className="mt-1 block text-sm text-slate-500"
                              >
                                {product.name_ar}
                              </span>
                            )}
                            <span className="mt-1 block text-xs text-slate-400">
                              {product.brand ||
                                product.manufacturer ||
                                "No brand"}
                              {product.model ? ` • ${product.model}` : ""}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <KindBadge kind={normalizeKind(product.product_kind)} />
                      </td>

                      <td className="px-5 py-4 text-sm">
                        {product.product_kind === "spare_part" ? (
                          <div className="space-y-1">
                            <strong className="block">
                              {product.part_number || "No Part Number"}
                            </strong>
                            {product.compatible_device && (
                              <span className="block text-slate-500">
                                For: {product.compatible_device}
                              </span>
                            )}
                            {product.part_condition && (
                              <span className="block text-blue-700">
                                {product.part_condition}
                              </span>
                            )}
                          </div>
                        ) : (
                          product.model || "—"
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm">
                        {product.category || "Uncategorized"}
                      </td>

                      <td className="px-5 py-4 font-bold">
                        {formatPrice(product)}
                      </td>

                      <td className="px-5 py-4 font-bold">
                        {product.stock ?? "—"}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={product.status ?? "draft"} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            aria-label={`Preview ${product.name_en}`}
                            onClick={() =>
                              router.push(`/vendor/products/${product.id}`)
                            }
                            className="rounded-xl bg-slate-100 p-2.5 text-slate-700"
                          >
                            <Eye size={18} />
                          </button>

                          <button
                            type="button"
                            aria-label={`Edit ${product.name_en}`}
                            onClick={() =>
                              router.push(`/vendor/products/${product.id}/edit`)
                            }
                            className="rounded-xl bg-blue-50 p-2.5 text-blue-700"
                          >
                            <Edit3 size={18} />
                          </button>

                          <button
                            type="button"
                            aria-label={`Delete ${product.name_en}`}
                            disabled={
                              deletingId !== null || !canDelete(product.status)
                            }
                            onClick={() => void deleteProduct(product)}
                            className="rounded-xl bg-red-50 p-2.5 text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {deletingId === product.id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function BulkImport({
  products,
  loading,
  loadError,
  onRefresh,
}: {
  products: Product[];
  loading: boolean;
  loadError: string;
  onRefresh: () => Promise<boolean>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);
  const imagesInputRef = useRef<HTMLInputElement>(null);
  const uploadedImages = useRef(new Map<File, { userId: string; url: string }>());
  const [images, setImages] = useState<Array<{ file: File; url: string }>>([]);
  const [imageChoices, setImageChoices] = useState<Record<string, string>>({});
  const [imageError, setImageError] = useState("");
  const [progress, setProgress] = useState("");

  useEffect(() => {
    return () => images.forEach((image) => URL.revokeObjectURL(image.url));
  }, [images]);

  function selectedImage(row: ImportRow) {
    const choice = imageChoices[productKey(row)];
    if (choice !== undefined) return images.find((image) => image.file.name === choice);
    const matches = images.filter((image) =>
      normalizeImageName(image.file.name, true) === normalizeImageName(row.name_en)
    );
    return matches.length === 1 ? matches[0] : undefined;
  }


  function chooseImages(files: File[]) {
    if (busyRef.current) return;
    setImageError("");
    try {
      if (files.length > 200) throw new Error("الحد الأقصى 200 صورة.");
      if (files.reduce((total, file) => total + file.size, 0) > 100 * 1024 * 1024) {
        throw new Error("إجمالي الصور يجب ألا يتجاوز 100 MB.");
      }
      if (new Set(files.map((file) => file.name)).size !== files.length) {
        throw new Error("أسماء الصور يجب ألا تتكرر.");
      }
      for (const file of files) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          throw new Error(`الصورة ${file.name}: استخدم JPG أو PNG أو WEBP.`);
        }
        if (!file.size || file.size > 5 * 1024 * 1024) {
          throw new Error(`الصورة ${file.name}: الحد الأقصى 5 MB ويجب ألا تكون فارغة.`);
        }
      }
      setImages(files.map((file) => ({ file, url: URL.createObjectURL(file) })));
      setImageChoices({});
      uploadedImages.current.clear();
    } catch (error: unknown) {
      setImageError(getErrorMessage(error, "تعذر اختيار الصور."));
    }
  }

  const [rows, setRows] = useState<ImportRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsReview, setNeedsReview] = useState(false);

  const assignedNames = rows.map((row) => selectedImage(row)?.file.name).filter(Boolean);
  const unusedImages = images.filter((image) => !assignedNames.includes(image.file.name));
  const repeatedImage = new Set(assignedNames).size !== assignedNames.length;


  const duplicateCount = useMemo(() => {
    const existing = new Set(products.map(productKey));
    return rows.filter((row) => existing.has(productKey(row))).length;
  }, [products, rows]);

  const blocked =
    busy ||
    loading ||
    Boolean(loadError) ||
    needsReview ||
    Boolean(imageError) ||
    unusedImages.length > 0 ||
    repeatedImage ||
    errors.length > 0 ||
    duplicateCount > 0 ||
    rows.length === 0;

  function downloadTemplate() {
    const example: Record<(typeof COLUMNS)[number], string> = {
      name_en: "Portable Shockwave Therapy",
      name_ar: "جهاز موجات تصادمية محمول",
      product_kind: "equipment",
      category: "Physiotherapy & Rehabilitation",
      brand: "",
      model: "",
      part_number: "",
      manufacturer: "",
      compatible_device: "",
      part_condition: "",
      image_url: "",
      sale_price: "",
      currency: "SAR",
      stock: "",
      available_for_sale: "true",
      available_for_rental: "false",
    };

    const csv = [
      COLUMNS.join(","),
      COLUMNS.map((column) => quoteCSV(example[column])).join(","),
    ].join("\r\n");

    const url = URL.createObjectURL(
      new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = "Health_Nations_Products_Template.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function readFile(file: File) {
    if (busyRef.current) return;

    busyRef.current = true;
    setBusy(true);
    setRows([]);
    setErrors([]);
    setNotice(null);
    setFileName(file.name);

    try {
      if (!/\.csv$/i.test(file.name)) {
        throw new Error("احفظ الملف من Excel بصيغة CSV UTF-8.");
      }

      if (file.size > 2 * 1024 * 1024) {
        throw new Error("الحد الأقصى لحجم الملف 2 MB.");
      }

      const text = await file.text();

      if (text.includes("\uFFFD") || text.includes("\u0000")) {
        throw new Error("ترميز الملف غير مناسب. استخدم CSV UTF-8.");
      }

      const result = validateCSV(text);
      setRows(result.rows);
      setErrors(result.errors);
    } catch (error: unknown) {
      setErrors([getErrorMessage(error, "تعذر قراءة الملف.")]);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function saveProducts() {
    if (blocked || busyRef.current) return;

    busyRef.current = true;
    setBusy(true);
    setNotice(null);

    let insertStarted = false;
    let insertedCount = 0;

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("سجّل الدخول أولًا.");

      const { data: existing, error: checkError } = await supabase
        .from("supplier_products")
        .select("name_en, brand, model, part_number")
        .eq("supplier_id", user.id);

      if (checkError) throw checkError;

      const keys = new Set((existing ?? []).map(productKey));
      const duplicate = rows.find((row) => keys.has(productKey(row)));

      if (duplicate) {
        throw new Error(
          `المنتج "${duplicate.name_en}" موجود بالفعل. احذفه من الملف وأعد رفعه.`
        );
      }

      const payload = [];
      // Upload every selected image before inserting any products.
      // Successful uploads are reused if a later upload fails in this session.
      for (const [index, row] of rows.entries()) {
        setProgress(`تجهيز المنتج ${index + 1} من ${rows.length}`);
        const image = selectedImage(row);
        let imageUrl = row.image_url;
        if (image) {
          const cached = uploadedImages.current.get(image.file);
          if (cached?.userId === user.id) {
            imageUrl = cached.url;
          } else {
            const extension = image.file.type === "image/png"
              ? "png" : image.file.type === "image/webp" ? "webp" : "jpg";
            const path = `products/${user.id}/${crypto.randomUUID()}.${extension}`;
            const storage = supabase.storage.from("vendor-assets");
            const { error: uploadError } = await storage.upload(path, image.file, {
              contentType: image.file.type,
              cacheControl: "3600",
              upsert: false,
            });
            if (uploadError) {
              throw new Error(`تعذر رفع صورة ${row.name_en}: ${uploadError.message}`);
            }
            imageUrl = storage.getPublicUrl(path).data.publicUrl;
            uploadedImages.current.set(image.file, { userId: user.id, url: imageUrl });
          }
        }
        payload.push({
          ...row,
          image_url: imageUrl,
          supplier_id: user.id,
          status: "pending" as const,
        });
      }
      setProgress("جارٍ حفظ المنتجات بصورها...");

      insertStarted = true;

      const { error } = await supabase
        .from("supplier_products")
        .insert(payload);

      if (error) throw error;

      insertStarted = false;
      insertedCount = rows.length;
      setImages([]);
      setImageChoices({});
      uploadedImages.current.clear();

      setRows([]);
      setErrors([]);
      setFileName("");

      const refreshed = await onRefresh();

      setNotice({
        error: false,
        text: refreshed
          ? `تم حفظ ${insertedCount} منتج وإرسالها للمراجعة.`
          : `تم حفظ ${insertedCount} منتج. اضغط Refresh لتحديث القائمة.`,
      });
    } catch (error: unknown) {
      if (insertedCount > 0) {
        setNotice({
          error: false,
          text: `تم حفظ ${insertedCount} منتج. حدّث القائمة لعرضها.`,
        });
      } else if (insertStarted) {
        setNeedsReview(true);
        setNotice({
          error: true,
          text: `تعذر تأكيد نتيجة الحفظ: ${getErrorMessage(
            error,
            "حدث خطأ."
          )} حدّث القائمة وراجعها قبل إعادة المحاولة.`,
        });
      } else {
        setNotice({
          error: true,
          text: `${getErrorMessage(error, "تعذر حفظ المنتجات.")} لم يبدأ حفظ المنتجات. قد تبقى صور مرفوعة غير مرتبطة؛ أعد المحاولة بنفس الاختيار لاستكمال الرفع.`,
        });
      }
    } finally {
      setProgress("");
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function reviewAfterError() {
    if (busyRef.current) return;

    busyRef.current = true;
    setBusy(true);

    try {
      const refreshed = await onRefresh();
      if (refreshed) setNeedsReview(false);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-xl font-black">
        <Upload className="text-blue-700" />
        Bulk Import | رفع منتجات دفعة واحدة
      </h2>

      <div
        dir="rtl"
        className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-600"
      >
        <p>
          نزّل النموذج، واستبدل المنتج التجريبي بمنتجاتك، ثم احفظه
          بصيغة CSV UTF-8. الحد الأقصى 200 منتج في الدفعة.
        </p>
        <p>
          اسم المنتج بالإنجليزية مطلوب. السعر والمخزون والصورة
          اختيارية. اترك السعر فارغًا لعرض التواصل بدل السعر.
        </p>
        <p>
          الأنواع: equipment أو consumable أو spare_part.
          حقول الإتاحة: true أو false. العملة الافتراضية SAR.
        </p>
        <p>
          اختَر صور المنتجات معًا من زر اختيار الصور. تتم المطابقة تلقائيًا
          حسب الاسم، ويمكن تعديلها في المعاينة. الصورة المختارة تحل محل رابط
          image_url إن وُجد. المنتجات الجديدة تُحفظ بحالة Pending للمراجعة.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={downloadTemplate} className={BUTTON}>
          <Download size={18} />
          تنزيل النموذج
        </button>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void readFile(file);
          }}
        />

        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className={BUTTON}
        >
          <Upload size={18} />
          اختيار ملف CSV
        </button>

        <input
          ref={imagesInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={busy || needsReview}
          className="hidden"
          onChange={(event) => {
            chooseImages(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={busy || needsReview}
          onClick={() => imagesInputRef.current?.click()}
          className={BUTTON}
        >
          <Upload size={18} />
          اختيار صور المنتجات ({images.length})
        </button>
        {images.length > 0 && (
          <button type="button" disabled={busy || needsReview} className={BUTTON}
            onClick={() => { setImages([]); setImageChoices({}); setImageError(""); }}>
            مسح الصور
          </button>
        )}

        <button
          type="button"
          disabled={blocked}
          onClick={() => void saveProducts()}
          className={PRIMARY}
        >
          {busy ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Plus size={18} />
          )}
          {busy ? "جارٍ التنفيذ..." : `إرسال ${rows.length} منتج للمراجعة`}
        </button>

        {rows.length > 0 && (
          <button
            type="button"
            disabled={busy}
            className={BUTTON}
            onClick={() => {
              setRows([]);
              setErrors([]);
              setFileName("");
              setNotice(null);
            }}
          >
            مسح الملف
          </button>
        )}
      </div>

      {progress && <p role="status" dir="rtl" className="mt-3 font-bold text-blue-700">{progress}</p>}
      {imageError && <Message error text={imageError} />}
      {unusedImages.length > 0 && (
        <Message error text={`اربط الصور التالية بمنتجات في المعاينة، أو أعد اختيار الصور: ${unusedImages.map((image) => image.file.name).join("، ")}`} />
      )}
      {repeatedImage && <Message error text="تم اختيار نفس الصورة لأكثر من منتج. اختَر صورة مختلفة لكل منتج." />}
      {fileName && (
        <p className="mt-3 break-all text-sm text-slate-500">{fileName}</p>
      )}

      {errors.length > 0 && (
        <div
          dir="rtl"
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
        >
          <p className="font-bold">
            أصلح الأخطاء ثم ارفع الملف مجددًا. الحفظ متوقف.
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {duplicateCount > 0 && (
        <Message
          error
          text={`يوجد ${duplicateCount} منتج مطابق لمنتجاتك الحالية حسب الاسم والماركة والموديل ورقم القطعة. احذف التكرار من الملف وأعد رفعه.`}
        />
      )}

      {notice && <Message error={notice.error} text={notice.text} />}

      {needsReview && (
        <button
          type="button"
          disabled={busy || loading}
          onClick={() => void reviewAfterError()}
          className={`${BUTTON} mt-4`}
        >
          <RefreshCw size={18} />
          تحديث القائمة ومراجعتها
        </button>
      )}

      {rows.length > 0 && (
        <div className="mt-5">
          <p className="mb-3 font-bold">
            معاينة المنتجات الصالحة: {rows.length}
          </p>

          <div className="max-h-[420px] overflow-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="sticky top-0 bg-slate-100">
                <tr>
                  {[
                    "#",
                    "Product",
                    "Type",
                    "Brand / Model",
                    "Price",
                    "Stock",
                    "Image",
                  ].map((title) => (
                    <th key={title} className="p-3">{title}</th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {rows.map((row, index) => (
                  <tr key={index}>
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3">
                      <strong className="block">{row.name_en}</strong>
                      <span dir="rtl" className="mt-1 block text-slate-500">
                        {row.name_ar}
                      </span>
                    </td>
                    <td className="p-3">
                      <KindBadge kind={row.product_kind} />
                    </td>
                    <td className="p-3">
                      {[row.brand, row.model].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td className="p-3">{formatPrice(row)}</td>
                    <td className="p-3">{row.stock ?? "—"}</td>
                    <td className="p-3">
                      {images.length > 0 && (
                        <select
                          aria-label={`صورة ${row.name_en}`}
                          disabled={busy || needsReview}
                          value={selectedImage(row)?.file.name ?? ""}
                          onChange={(event) => setImageChoices((current) => ({
                            ...current, [productKey(row)]: event.target.value,
                          }))}
                          className={`${INPUT} mb-2 min-w-[220px]`}
                        >
                          <option value="">استخدام رابط CSV / بدون صورة</option>
                          {images.map((image) => (
                            <option key={image.file.name} value={image.file.name}>{image.file.name}</option>
                          ))}
                        </select>
                      )}
                      {(selectedImage(row)?.url || row.image_url) ? (
                        <img
                          src={selectedImage(row)?.url || row.image_url || ""}
                          alt={row.name_en}
                          className="h-24 w-32 rounded-lg bg-slate-50 object-contain"
                        />
                      ) : "بدون صورة"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function validateCSV(text: string): {
  rows: ImportRow[];
  errors: string[];
} {
  const [rawHeaders, ...records] = parseCSV(text);

  if (!rawHeaders || records.length === 0) {
    throw new Error("الملف لا يحتوي على منتجات.");
  }

  if (records.length > 200) {
    throw new Error("الحد الأقصى 200 منتج في الدفعة.");
  }

  const headers = rawHeaders.map((value) => value.trim().toLowerCase());

  if (new Set(headers).size !== headers.length) {
    throw new Error("يوجد اسم عمود مكرر.");
  }

  if (!headers.includes("name_en")) {
    throw new Error("العمود name_en مطلوب.");
  }

  const unknown = headers.filter(
    (header) => !COLUMNS.some((column) => column === header)
  );

  if (unknown.length > 0) {
    throw new Error(`أعمدة غير معروفة: ${unknown.join(", ")}.`);
  }

  const rows: ImportRow[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  records.forEach((cells, index) => {
    try {
      if (cells.length !== headers.length) {
        throw new Error("عدد الخانات لا يطابق عدد الأعمدة.");
      }

      const record = Object.fromEntries(
        headers.map((header, position) => [header, cells[position].trim()])
      ) as Record<string, string>;

      if (!record.name_en) {
        throw new Error("اسم المنتج بالإنجليزية مطلوب.");
      }

      const kind = record.product_kind || "equipment";

      if (
        kind !== "equipment" &&
        kind !== "consumable" &&
        kind !== "spare_part"
      ) {
        throw new Error(
          "نوع المنتج يجب أن يكون equipment أو consumable أو spare_part."
        );
      }

      const currency = (record.currency || "SAR").toUpperCase();

      if (!/^[A-Z]{3}$/.test(currency)) {
        throw new Error("استخدم رمز عملة مثل SAR أو USD.");
      }

      const imageUrl = record.image_url || null;

      if (imageUrl) {
        let url: URL;

        try {
          url = new URL(imageUrl);
        } catch {
          throw new Error("رابط الصورة غير صحيح.");
        }

        if (url.protocol !== "https:" || url.username || url.password) {
          throw new Error("الصورة تحتاج رابط HTTPS صالحًا.");
        }
      }

      const row: ImportRow = {
        name_en: record.name_en,
        name_ar: record.name_ar || null,
        product_kind: kind,
        category: record.category || null,
        brand: record.brand || null,
        model: record.model || null,
        part_number: record.part_number || null,
        manufacturer: record.manufacturer || null,
        compatible_device: record.compatible_device || null,
        part_condition: record.part_condition || null,
        image_url: imageUrl,
        sale_price: readNumber(record.sale_price, "السعر"),
        currency,
        stock: readNumber(record.stock, "المخزون", true),
        available_for_sale: readBoolean(record.available_for_sale, true),
        available_for_rental: readBoolean(record.available_for_rental, false),
      };

      const key = productKey(row);

      if (seen.has(key)) {
        throw new Error("المنتج مكرر داخل الملف.");
      }

      seen.add(key);
      rows.push(row);
    } catch (error: unknown) {
      errors.push(
        `المنتج ${index + 1}: ${getErrorMessage(error, "بيانات غير صحيحة.")}`
      );
    }
  });

  return { rows, errors };
}

function parseCSV(source: string): string[][] {
  const text = source.replace(/^\uFEFF/, "");
  const firstLine = text.split(/\r\n|\n|\r/, 1)[0] || "";
  const separator =
    firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let closedQuote = false;

  function finishCell() {
    row.push(cell);
    cell = "";
    closedQuote = false;
  }

  function finishRow() {
    finishCell();
    if (row.some((value) => value.trim() !== "")) rows.push(row);
    row = [];
  }

  for (let index = 0; index < text.length; index++) {
    const character = text[index];

    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          cell += '"';
          index++;
        } else {
          quoted = false;
          closedQuote = true;
        }
      } else {
        cell += character;
      }
      continue;
    }

    if (character === separator) {
      finishCell();
    } else if (character === "\r" || character === "\n") {
      if (character === "\r" && text[index + 1] === "\n") index++;
      finishRow();
    } else if (character === '"') {
      if (cell.length > 0 || closedQuote) {
        throw new Error("تنسيق علامات الاقتباس غير صحيح.");
      }
      quoted = true;
    } else if (closedQuote) {
      if (!/\s/.test(character)) {
        throw new Error("توجد بيانات خارج خانة مقتبسة.");
      }
    } else {
      cell += character;
    }
  }

  if (quoted) {
    throw new Error("توجد علامة اقتباس غير مغلقة.");
  }

  finishRow();
  return rows;
}

function readNumber(
  value: string | undefined,
  label: string,
  integer = false
): number | null {
  if (!value?.trim()) return null;

  if (!/^\d+(\.\d+)?$/.test(value.trim())) {
    throw new Error(`${label}: استخدم رقمًا بدون عملة أو فواصل آلاف.`);
  }

  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number < 0 ||
    (integer && !Number.isSafeInteger(number))
  ) {
    throw new Error(`${label}: الرقم غير صالح.`);
  }

  return number;
}

function readBoolean(
  value: string | undefined,
  fallback: boolean
): boolean {
  const text = value?.trim().toLowerCase();
  if (!text) return fallback;
  if (text === "true" || text === "1") return true;
  if (text === "false" || text === "0") return false;
  throw new Error("حقول الإتاحة تقبل true أو false فقط.");
}

function quoteCSV(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function productKey(product: {
  name_en: string;
  brand: string | null;
  model: string | null;
  part_number: string | null;
}): string {
  return JSON.stringify(
    [
      product.name_en,
      product.brand,
      product.model,
      product.part_number,
    ].map((value) =>
      (value || "").trim().toLowerCase().replace(/\s+/g, " ")
    )
  );
}

function normalizeKind(kind: ProductKind | null): ProductKind {
  return kind === "consumable" || kind === "spare_part"
    ? kind
    : "equipment";
}

function canDelete(status: ProductStatus | null): boolean {
  return status === "draft" || status === "pending" || status === "rejected";
}

function formatPrice(product: ProductFields): string {
  if (product.available_for_sale && product.sale_price !== null) {
    return `${Number(product.sale_price).toLocaleString()} ${
      product.currency || ""
    }`.trim();
  }
  return product.available_for_rental ? "Rental" : "Contact";
}

function KindBadge({ kind }: { kind: ProductKind }) {
  const styles: Record<ProductKind, string> = {
    equipment: "bg-blue-100 text-blue-800",
    consumable: "bg-emerald-100 text-emerald-800",
    spare_part: "bg-amber-100 text-amber-800",
  };

  const labels: Record<ProductKind, string> = {
    equipment: "Equipment",
    consumable: "Consumable",
    spare_part: "Spare Part",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${styles[kind]}`}
    >
      {labels[kind]}
    </span>
  );
}

function StatusBadge({ status }: { status: ProductStatus }) {
  const styles: Record<ProductStatus, string> = {
    draft: "bg-slate-100 text-slate-700",
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-100 text-red-700",
    suspended: "bg-purple-100 text-purple-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-3xl bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-bold text-slate-500">{label}</p>
        <strong className="mt-2 block text-3xl font-black">{value}</strong>
      </div>
      <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">{icon}</div>
    </div>
  );
}

function Message({ error, text }: { error: boolean; text: string }) {
  return (
    <div
      role={error ? "alert" : "status"}
      className={`mt-4 flex items-start gap-3 rounded-xl border p-4 ${
        error
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      <AlertCircle size={20} className="mt-0.5 shrink-0" />
      <span dir="rtl">{text}</span>
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = String(error.message || fallback);
    const code = "code" in error ? String(error.code || "") : "";
    return code ? `${message} — Code: ${code}` : message;
  }

  return typeof error === "string" ? error : fallback;
}

function normalizeImageName(value: string, fileName = false): string {
  const name = fileName
    ? value.replace(/\.(jpe?g|png|webp)$/i, "").replace(/^\d+[_\s-]+/, "")
    : value;
  return name.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}
