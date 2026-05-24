"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ImagePlus, Loader2, Send, X } from "lucide-react";
import { submitOrderIssue } from "@/app/bakery/actions";
import { formatOrderDisplayLabel } from "@/lib/order-display";
import { RupeeAmount } from "@/components/ui/RupeeAmount";
import { cn } from "@/lib/utils";

type IssueType = "quality" | "missing_item" | "wrong_item" | "delivery" | "payment" | "other";

type OrderIssueClientProps = {
    order: {
        id: string;
        order_number?: string;
        total_price: number;
        status: string;
        created_at: string;
    };
};

type OptimizedImage = {
    id: string;
    file: File;
    previewUrl: string;
};

const issueOptions: Array<{ value: IssueType; label: string }> = [
    { value: "quality", label: "Quality" },
    { value: "missing_item", label: "Missing Item" },
    { value: "wrong_item", label: "Wrong Item" },
    { value: "delivery", label: "Delivery" },
    { value: "payment", label: "Payment" },
    { value: "other", label: "Other" },
];

const maxImages = 3;
const maxImageDimension = 1600;
const imageQuality = 0.78;

function loadImage(file: File) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => {
            URL.revokeObjectURL(url);
            resolve(image);
        };
        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Could not read image."));
        };
        image.src = url;
    });
}

async function optimizeImage(file: File) {
    const image = await loadImage(file);
    const scale = Math.min(1, maxImageDimension / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image optimization is not available in this browser.");

    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((optimizedBlob) => {
            if (!optimizedBlob) {
                reject(new Error("Could not optimize image."));
                return;
            }
            resolve(optimizedBlob);
        }, "image/webp", imageQuality);
    });

    return new File(
        [blob],
        `${file.name.replace(/\.[^.]+$/, "") || "order-issue"}.webp`,
        { type: "image/webp" }
    );
}

export default function OrderIssueClient({ order }: OrderIssueClientProps) {
    const [issueType, setIssueType] = useState<IssueType>("quality");
    const [description, setDescription] = useState("");
    const [images, setImages] = useState<OptimizedImage[]>([]);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const imagesRef = useRef<OptimizedImage[]>([]);

    const canSubmit = useMemo(
        () => description.trim().length >= 3 && !isOptimizing && !isSubmitting,
        [description, isOptimizing, isSubmitting]
    );

    useEffect(() => {
        imagesRef.current = images;
    }, [images]);

    useEffect(() => {
        return () => {
            imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
        };
    }, []);

    const handleImageSelect = async (files: FileList | null) => {
        if (!files?.length) return;

        setMessage(null);
        setIsOptimizing(true);

        try {
            const remainingSlots = maxImages - images.length;
            const selectedFiles = Array.from(files).slice(0, remainingSlots);
            if (selectedFiles.length === 0) {
                setMessage({ type: "error", text: `You can upload up to ${maxImages} images.` });
                return;
            }

            const optimized = await Promise.all(selectedFiles.map(async (file) => {
                if (!file.type.startsWith("image/")) {
                    throw new Error("Only image files are allowed.");
                }

                const optimizedFile = await optimizeImage(file);
                if (optimizedFile.size > 2 * 1024 * 1024) {
                    throw new Error("One optimized image is still larger than 2MB.");
                }

                return {
                    id: crypto.randomUUID(),
                    file: optimizedFile,
                    previewUrl: URL.createObjectURL(optimizedFile),
                };
            }));

            setImages((current) => [...current, ...optimized]);
        } catch (err) {
            setMessage({
                type: "error",
                text: err instanceof Error ? err.message : "Could not optimize image.",
            });
        } finally {
            setIsOptimizing(false);
        }
    };

    const removeImage = (id: string) => {
        setImages((current) => {
            const removed = current.find((image) => image.id === id);
            if (removed) URL.revokeObjectURL(removed.previewUrl);
            return current.filter((image) => image.id !== id);
        });
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!canSubmit) return;

        setIsSubmitting(true);
        setMessage(null);

        const formData = new FormData();
        formData.append("orderId", order.id);
        formData.append("issueType", issueType);
        formData.append("description", description);
        images.forEach((image) => formData.append("images", image.file));

        const result = await submitOrderIssue(formData);
        if (result.success) {
            setMessage({ type: "success", text: "Issue raised successfully. Our team will review it shortly." });
            setDescription("");
            setImages((current) => {
                current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
                return [];
            });
        } else {
            setMessage({ type: "error", text: result.error || "Could not raise the issue." });
        }

        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-brand-soft-gray px-4 pb-16 pt-28 sm:px-6 md:pt-32">
            <div className="mx-auto max-w-4xl space-y-8">
                <Link
                    href="/bakery/settings?tab=orders"
                    className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-gold-bright transition-all hover:gap-3"
                >
                    <ArrowLeft size={16} aria-hidden="true" />
                    Back to orders
                </Link>

                <div className="rounded-[1.5rem] bg-white p-5 shadow-premium sm:rounded-[2rem] sm:p-8">
                    <div className="mb-8 flex flex-col gap-4 border-b border-brand-olive-dark/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                Raise issue for {formatOrderDisplayLabel(order)}
                            </p>
                            <h1 className="text-3xl font-serif font-black text-brand-olive-dark">
                                Tell us what went wrong
                            </h1>
                        </div>
                        <div className="text-left sm:text-right">
                            <p className="text-xs font-bold text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                            <p className="text-lg font-black text-brand-gold-bright">
                                <RupeeAmount value={order.total_price} />
                            </p>
                        </div>
                    </div>

                    {message && (
                        <div
                            className={cn(
                                "mb-6 rounded-2xl p-4 text-sm font-bold",
                                message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                {message.type === "success" && <CheckCircle2 size={18} aria-hidden="true" />}
                                <span>{message.text}</span>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-7">
                        <div className="space-y-3">
                            <label htmlFor="issueType" className="ml-4 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                Issue type
                            </label>
                            <select
                                id="issueType"
                                value={issueType}
                                onChange={(event) => setIssueType(event.target.value as IssueType)}
                                className="w-full rounded-2xl border-2 border-transparent bg-brand-soft-gray px-6 py-4 text-sm font-bold text-brand-olive-dark outline-none transition-all focus:border-brand-gold-bright/30"
                            >
                                {issueOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-3">
                            <label htmlFor="description" className="ml-4 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                Details
                            </label>
                            <textarea
                                id="description"
                                required
                                minLength={3}
                                rows={7}
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                className="w-full resize-none rounded-2xl border-2 border-transparent bg-brand-soft-gray px-6 py-4 text-sm font-bold leading-relaxed text-brand-olive-dark outline-none transition-all focus:border-brand-gold-bright/30"
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <label className="ml-4 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                    Evidence images
                                </label>
                                <span className="text-xs font-bold text-gray-500">{images.length}/{maxImages} uploaded</span>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                {images.map((image) => (
                                    <div key={image.id} className="relative aspect-square overflow-hidden rounded-2xl bg-brand-soft-gray">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={image.previewUrl} alt="" className="h-full w-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(image.id)}
                                            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-olive-dark shadow-sm transition-colors hover:text-red-500"
                                            aria-label="Remove image"
                                        >
                                            <X size={16} aria-hidden="true" />
                                        </button>
                                    </div>
                                ))}

                                {images.length < maxImages && (
                                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-brand-olive-dark/15 bg-brand-soft-gray text-brand-olive-dark transition-all hover:border-brand-gold-bright hover:text-brand-gold-bright">
                                        {isOptimizing ? <Loader2 className="animate-spin" size={28} aria-hidden="true" /> : <ImagePlus size={28} aria-hidden="true" />}
                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                            {isOptimizing ? "Optimizing" : "Add image"}
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            hidden
                                            disabled={isOptimizing}
                                            onChange={(event) => {
                                                handleImageSelect(event.target.files);
                                                event.target.value = "";
                                            }}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-brand-olive-dark px-6 py-5 text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all hover:bg-brand-gold-bright hover:text-brand-olive-dark disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
                            Raise Issue
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
