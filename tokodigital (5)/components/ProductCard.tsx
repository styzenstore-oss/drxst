import Link from "next/link";
import { Product, formatRupiah } from "@/lib/helpers";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="card group flex flex-col overflow-hidden transition hover:border-brand"
    >
      <div className="flex aspect-video items-center justify-center bg-surface2 text-mist/30">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="font-display text-3xl">
            {product.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="badge w-fit bg-surface2 text-mist/70">{product.category}</span>
        <h3 className="line-clamp-2 font-semibold text-mist group-hover:text-brand-light">
          {product.name}
        </h3>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-display font-bold text-amber">
            {formatRupiah(product.price)}
          </span>
          <span className="text-xs text-mist/50">Stok {product.stock}</span>
        </div>
      </div>
    </Link>
  );
}
