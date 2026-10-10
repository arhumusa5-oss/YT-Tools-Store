'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Product } from '@/lib/types';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Check,
  UploadCloud,
  Loader2,
} from 'lucide-react';

interface ProductFormProps {
  initialProduct?: Product;
  isEdit?: boolean;
}

export default function ProductForm({ initialProduct, isEdit = false }: ProductFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialProduct?.title || '');
  const [slug, setSlug] = useState(initialProduct?.slug || '');
  const [category, setCategory] = useState(initialProduct?.category || 'Tools');
  const [customCategory, setCustomCategory] = useState('');
  const [shortDescription, setShortDescription] = useState(initialProduct?.shortDescription || '');
  const [fullDescription, setFullDescription] = useState(initialProduct?.fullDescription || '');
  const [keyFeatures, setKeyFeatures] = useState<string[]>(
    initialProduct?.keyFeatures || ['Private and verified access', '100% replacement warranty']
  );
  const [newFeatureInput, setNewFeatureInput] = useState('');

  const [pricePKR, setPricePKR] = useState(initialProduct?.pricePKR?.toString() || '1500');
  const [originalPricePKR, setOriginalPricePKR] = useState(
    initialProduct?.originalPricePKR?.toString() || '3000'
  );
  const [priceUSD, setPriceUSD] = useState(initialProduct?.priceUSD?.toString() || '5.5');
  const [originalPriceUSD, setOriginalPriceUSD] = useState(
    initialProduct?.originalPriceUSD?.toString() || '11.0'
  );

  const [isSoldOut, setIsSoldOut] = useState(initialProduct?.isSoldOut || false);
  const [allowQuantity, setAllowQuantity] = useState(initialProduct?.allowQuantity || false);
  const [badge, setBadge] = useState<Product['badge']>(initialProduct?.badge || '');
  const [buttonText, setButtonText] = useState(
    initialProduct?.buttonText || 'Order on WhatsApp'
  );
  const [deliveryType, setDeliveryType] = useState(
    initialProduct?.deliveryType || 'Instant Access'
  );
  const [deliveryNotes, setDeliveryNotes] = useState(
    initialProduct?.deliveryNotes ||
      'Delivered within 15-30 minutes directly to your WhatsApp or Email.'
  );

  const [images, setImages] = useState<string[]>(
    initialProduct?.images || [
      'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80',
    ]
  );
  const [newImageInput, setNewImageInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-generate slug when title changes (if not in edit mode or slug is empty)
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEdit || !slug) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      );
    }
  };

  // Auto calculate USD roughly if PKR changes
  const handlePKRChange = (val: string) => {
    setPricePKR(val);
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      setPriceUSD((num / 280).toFixed(2));
    }
  };

  const handleOriginalPKRChange = (val: string) => {
    setOriginalPricePKR(val);
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      setOriginalPriceUSD((num / 280).toFixed(2));
    }
  };

  // Add Key Feature
  const handleAddFeature = () => {
    if (!newFeatureInput.trim()) return;
    setKeyFeatures([...keyFeatures, newFeatureInput.trim()]);
    setNewFeatureInput('');
  };

  const handleRemoveFeature = (idx: number) => {
    setKeyFeatures(keyFeatures.filter((_, i) => i !== idx));
  };

  // Add Image URL
  const handleAddImage = () => {
    if (!newImageInput.trim()) return;
    setImages([...images, newImageInput.trim()]);
    setNewImageInput('');
  };

  const handleRemoveImage = (idx: number) => {
    if (images.length === 1) {
      alert('Product must have at least 1 image.');
      return;
    }
    setImages(images.filter((_, i) => i !== idx));
  };

  // Direct file upload from computer
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setImages((prev) => [...prev, data.url]);
      } else {
        setUploadError(data.error || 'Failed to upload image.');
      }
    } catch {
      setUploadError('Network error uploading image.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Product Title is required.');
      return;
    }

    if (!pricePKR || isNaN(Number(pricePKR))) {
      setErrorMsg('Valid Price in PKR is required.');
      return;
    }

    setSaving(true);
    try {
      const selectedCategory = category === 'Other' && customCategory ? customCategory : category;

      const payload = {
        title: title.trim(),
        slug: slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category: selectedCategory,
        shortDescription,
        fullDescription,
        keyFeatures,
        pricePKR: Number(pricePKR),
        originalPricePKR: Number(originalPricePKR) || Number(pricePKR) * 1.5,
        priceUSD: Number(priceUSD) || Number(pricePKR) / 280,
        originalPriceUSD: Number(originalPriceUSD) || (Number(pricePKR) / 280) * 1.5,
        isSoldOut,
        allowQuantity,
        badge,
        buttonText: buttonText.trim() || 'Order on WhatsApp',
        deliveryType,
        deliveryNotes,
        images: images.filter((img) => img.trim().length > 0),
      };

      const url = isEdit ? `/api/products/${initialProduct?.id}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save product.');
      }

      router.push('/admin/products');
    } catch (err) {
      setErrorMsg((err as Error).message || 'Error occurred while saving product.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {/* Top Back & Action */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </Link>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E64A00] hover:opacity-90 text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition active:scale-95 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : isEdit ? 'Update Product' : 'Publish Product'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Basic Info Card */}
      <div className="bg-[#0C0C0E] border border-[#222228] rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Basic Product Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Product Title <span className="text-[#FF5500]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Canva Pro Lifetime Activation"
              className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              URL Slug (Unique)
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="canva-pro-lifetime"
              className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs font-mono focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none"
            >
              <option value="Tools">Tools</option>
              <option value="Services">Services</option>
              <option value="Other">Other (Custom)</option>
            </select>
          </div>

          {category === 'Other' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Custom Category Name
              </label>
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="e.g. Automation Bots"
                className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Badge Tag</label>
            <select
              value={badge}
              onChange={(e) => setBadge(e.target.value as Product['badge'])}
              className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none"
            >
              <option value="">No Badge</option>
              <option value="HOT">HOT 🔥</option>
              <option value="BEST SELLER">BEST SELLER ⭐</option>
              <option value="SALE">SALE ⚡</option>
              <option value="TRENDING">TRENDING 🚀</option>
              <option value="INSTANT">INSTANT ACCESS ⚡</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1">
            Short Description (Displayed on card)
          </label>
          <input
            type="text"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="Brief 1-2 line summary of what this tool does..."
            className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1">
            Full Description (Overview & Features)
          </label>
          <textarea
            rows={4}
            value={fullDescription}
            onChange={(e) => setFullDescription(e.target.value)}
            placeholder="Detailed overview for the customer, what benefits it provides, etc."
            className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Pricing & Sold Out Card */}
      <div className="bg-[#0C0C0E] border border-[#222228] rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Pricing & Stock Status
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Sale Price (PKR) <span className="text-[#FF5500]">*</span>
            </label>
            <input
              type="number"
              required
              value={pricePKR}
              onChange={(e) => handlePKRChange(e.target.value)}
              placeholder="e.g. 1500"
              className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Original Price (PKR) <span className="text-zinc-500">(For Strikethrough)</span>
            </label>
            <input
              type="number"
              value={originalPricePKR}
              onChange={(e) => handleOriginalPKRChange(e.target.value)}
              placeholder="e.g. 3000"
              className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none"
            />
          </div>
        </div>

        {/* Sold Out Toggle */}
        <div className="pt-2">
          <label className="relative flex items-center gap-3 p-4 rounded-xl bg-black border border-[#222228] cursor-pointer hover:border-[#2E354D] transition">
            <input
              type="checkbox"
              checked={isSoldOut}
              onChange={(e) => setIsSoldOut(e.target.checked)}
              className="w-5 h-5 rounded accent-[#FF5500]"
            />
            <div>
              <span className="font-bold text-white text-xs block">
                Mark as Sold Out
              </span>
              <span className="text-[11px] text-zinc-400">
                When checked, the product card will show &apos;Sold Out&apos; badge and ordering will be disabled.
              </span>
            </div>
          </label>
        </div>

        {/* Allow Quantity Selection Toggle */}
        <div className="pt-2">
          <label className="relative flex items-center gap-3 p-4 rounded-xl bg-black border border-[#222228] cursor-pointer hover:border-[#2E354D] transition">
            <input
              type="checkbox"
              checked={allowQuantity}
              onChange={(e) => setAllowQuantity(e.target.checked)}
              className="w-5 h-5 rounded accent-[#FF5500]"
            />
            <div>
              <span className="font-bold text-white text-xs block flex items-center gap-2">
                <span>Enable Quantity Selection (+ / -)</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/30">
                  Customer Feature
                </span>
              </span>
              <span className="text-[11px] text-zinc-400">
                Allow customers to select quantity (1x, 2x, 5x, 10x etc.) with dynamic live price on card/modal and in WhatsApp message. Perfect for Gmails, Mails, Proxies, Accounts.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Key Features Builder Card */}
      <div className="bg-[#0C0C0E] border border-[#222228] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Product Key Features & Bullet Points
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              These checkmark bullet points will be displayed prominently on the product card and detail modal.
            </p>
          </div>
          <span className="text-xs font-bold text-[#FF5500] bg-[#FF5500]/15 px-2.5 py-1 rounded-lg border border-[#FF5500]/30">
            {keyFeatures.length} Added
          </span>
        </div>

        {/* Input to add new feature */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newFeatureInput}
            onChange={(e) => setNewFeatureInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddFeature();
              }
            }}
            placeholder="Type a key feature (e.g. 'Activated on personal email', 'Full warranty')..."
            className="flex-1 px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddFeature}
            className="px-4 py-2.5 rounded-xl bg-[#141418] hover:bg-[#1E1E26] text-white font-bold text-xs border border-[#2B3147] flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Feature</span>
          </button>
        </div>

        {/* Feature List */}
        <div className="space-y-2 pt-2">
          {keyFeatures.map((feat, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-black border border-[#1C1C22] text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-zinc-200 truncate">{feat}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveFeature(idx)}
                className="p-1 rounded text-zinc-500 hover:text-red-400 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Instructions */}
      <div className="bg-[#0C0C0E] border border-[#222228] rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Digital Delivery Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Delivery Mechanism Tag
            </label>
            <input
              type="text"
              value={deliveryType}
              onChange={(e) => setDeliveryType(e.target.value)}
              placeholder="e.g. Email Invitation, Instant WhatsApp, Download Link"
              className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Delivery Notes (Instructions for buyer)
            </label>
            <input
              type="text"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="e.g. Provide your Gmail. You will receive an invitation within 15-30 minutes."
              className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* WhatsApp Button Customization Card */}
      <div className="bg-[#0C0C0E] border border-[#222228] rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              WhatsApp Button Customization
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Customize the text displayed on the green WhatsApp button (e.g. for tools: &ldquo;Order on WhatsApp&rdquo;, for services: &ldquo;Inquire on WhatsApp&rdquo; or &ldquo;Book Service&rdquo;).
            </p>
          </div>
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 shrink-0">
            Default: Order on WhatsApp
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1">
            Button Text Label
          </label>
          <input
            type="text"
            value={buttonText}
            onChange={(e) => setButtonText(e.target.value)}
            placeholder="e.g. Order on WhatsApp, Inquire on WhatsApp, Book Service"
            className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none"
          />
        </div>

        {/* Quick Suggestion Chips */}
        <div>
          <span className="text-[11px] text-zinc-400 block mb-2 font-medium">Quick Suggestions (click to apply):</span>
          <div className="flex flex-wrap gap-2">
            {[
              'Order on WhatsApp',
              'Inquire on WhatsApp',
              'Book Service on WhatsApp',
              'Contact on WhatsApp',
              'Chat on WhatsApp',
              'Apply on WhatsApp',
            ].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setButtonText(suggestion)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition border ${
                  buttonText === suggestion
                    ? 'bg-[#FF5500] text-white border-[#FF5500]'
                    : 'bg-black text-zinc-400 border-[#222228] hover:text-white hover:border-zinc-700'
                }`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Images Management Card */}
      <div className="bg-[#0C0C0E] border border-[#222228] rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Product Images
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Upload image files directly from your computer or paste any image URL.
            </p>
          </div>
          <span className="text-xs font-bold text-[#FF5500] bg-[#FF5500]/15 px-2.5 py-1 rounded-lg border border-[#FF5500]/30 self-start sm:self-auto">
            {images.length} Images Added
          </span>
        </div>

        {uploadError && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs">
            {uploadError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Upload from Computer Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-5 rounded-xl bg-black border-2 border-dashed border-[#2A2A36] hover:border-[#FF5500] flex flex-col items-center justify-center cursor-pointer transition group text-center"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
              className="hidden"
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2 text-xs text-zinc-300 py-2">
                <Loader2 className="w-6 h-6 text-[#FF5500] animate-spin" />
                <span>Uploading image from computer...</span>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-[#141418] group-hover:bg-[#FF5500]/15 border border-[#222228] group-hover:border-[#FF5500]/30 flex items-center justify-center text-zinc-400 group-hover:text-[#FF5500] mb-2 transition">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-white group-hover:text-[#FF5500] transition">
                  Upload from Computer
                </span>
                <span className="text-[10px] text-zinc-500 mt-0.5">
                  Click to select PNG, JPG, or WebP
                </span>
              </>
            )}
          </div>

          {/* Paste URL Box */}
          <div className="p-4 rounded-xl bg-black border border-[#222228] flex flex-col justify-between">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Or Paste Image Web URL
              </label>
              <input
                type="text"
                value={newImageInput}
                onChange={(e) => setNewImageInput(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-[#0C0C0E] border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none mb-2"
              />
            </div>
            <button
              type="button"
              onClick={handleAddImage}
              className="w-full py-2 px-3 rounded-xl bg-[#141418] hover:bg-[#1E1E26] text-zinc-300 hover:text-white border border-[#2B3147] text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add URL to Images</span>
            </button>
          </div>
        </div>

        {/* Image Previews */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative aspect-video rounded-xl overflow-hidden bg-black border border-[#222228] group"
            >
              <img src={img} alt="Product preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemoveImage(idx)}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition opacity-0 group-hover:opacity-100"
                title="Remove image"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              {idx === 0 && (
                <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/70 text-[9px] font-bold text-white">
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Save Action Bottom */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E64A00] hover:opacity-90 text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 transition active:scale-95 disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : isEdit ? 'Update Product' : 'Publish Product'}</span>
        </button>
      </div>
    </form>
  );
}
