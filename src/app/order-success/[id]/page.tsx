import { redirect } from 'next/navigation';

export default function OrderSuccessPage() {
  // Prevent any public link fabrication or direct URL browsing of order receipts
  redirect('/');
}
