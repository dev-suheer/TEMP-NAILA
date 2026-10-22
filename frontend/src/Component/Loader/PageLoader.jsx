import Loading from "./Loading";

const PageLoader = () => {
  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center">
      <Loading />
    </div>
  );
};

export default PageLoader;
