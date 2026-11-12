export default function Loading() {
  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[999999] h-[3px] bg-transparent pointer-events-none overflow-hidden"
    >
      <div className="h-full w-2/3 bg-gradient-to-r from-[#660000] via-[#cc1111] to-[#ff4d4d] animate-pulse shadow-[0_0_12px_rgba(204,17,17,0.75)]" />
    </div>
  );
}
