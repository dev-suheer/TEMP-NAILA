/* eslint-disable react/prop-types */

const PackingSection = ({ step, title, aside, children }) => {
  return (
    <section className="mx-2 mt-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 md:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#252525] text-xs font-semibold text-white dark:bg-gray-200 dark:text-gray-900">
            {step}
          </span>
          
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            
         
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
};

export default PackingSection;
