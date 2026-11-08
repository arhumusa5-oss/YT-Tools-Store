import BufferingLoader from '@/components/BufferingLoader';

export default function Loading() {
  return (
    <BufferingLoader
      show={true}
      message="Loading Page..."
      subtitle="Please wait a moment..."
    />
  );
}
