import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { IoAdd } from "react-icons/io5";
import BaseModals from "./Modals/BaseModals";
import LaceModal from "./Modals/LaceModal";
import BagModal from "./Modals/BagModal";
import AccessoriesModal from "./Modals/AccessoriesModal";
import SuitsModal from "./Modals/SuitsModal";
import { useDispatch, useSelector } from "react-redux";
import BaseTable from "./Tables/BaseTable";
import LaceTable from "./Tables/LaceTable";
import BagBoxTable from "./Tables/BagBoxTable";
import AccessoriesTable from "./Tables/AccessoriesTable";
import SuitsTable from "./Tables/SuitsTable";
import {
  clearValiDateSeller,
  validateOldSellerAsync,
} from "../../features/SellerSlice";
import BillFilters, {
  emptyBillFilters,
} from "../../Component/BillFilters/BillFilters";
import { buildPaginationQuery, getPageLimit } from "../../Utils/Common";
import AppSelect from "../../Component/Common/select/AppSelect";

const purchaseCategories = ["Base", "Lace", "Bag/box", "Accessories", "Suits"];

const PurchaseBills = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const limit = getPageLimit(searchParams);

  const [sellerDetails, setSellerDetails] = useState("");
  const [searchUser, setSearchUser] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchModal, setSearchModal] = useState();

  const { searchLoading, validateSeller, PurchasingHistory } = useSelector(
    (state) => state.Seller,
  );

  const [filters, setFilters] = useState(emptyBillFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyBillFilters);

  const [selectedCategory, setSelectedCategory] = useState("Base");
  const [clearFormData, SetClearFormData] = useState("");


  const handleCategoryFilterChange = (category) => {
    const nextCategory = category || "Base";
    setSelectedCategory(nextCategory);
    setFilters(emptyBillFilters);
    setAppliedFilters(emptyBillFilters);
    setSearchUser(false);
    setSellerDetails("");
    dispatch(clearValiDateSeller());
    navigate(`/dashboard/purchasebills${buildPaginationQuery(searchParams, { page: 1, limit })}`);
  };

  const swapModal = () => {
    closeSearchModal();
    openModal();
    SetClearFormData("Remove");
  };

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    dispatch(clearValiDateSeller());
    setSellerDetails("");
  };

  const openSearchModal = () => {
    setSearchModal(true);
  };

  const closeSearchModal = () => {
    setSearchModal(false);
    setSearchUser(false);
    dispatch(clearValiDateSeller());
  };

  const handleOldSellerClick = () => {
    setSearchUser(true);
    dispatch(validateOldSellerAsync({ category: selectedCategory }));
  };

  const handleFiltersSearch = () => {
    setAppliedFilters(filters);
    navigate(`/dashboard/purchasebills${buildPaginationQuery(searchParams, { page: 1, limit })}`);
  };

  const handleResetFilters = () => {
    setFilters(emptyBillFilters);
    setAppliedFilters(emptyBillFilters);
    navigate(`/dashboard/purchasebills${buildPaginationQuery(searchParams, { page: 1, limit })}`);
  };

  const handleChooseSeller = (selectedOption) => {
    if (selectedOption?.seller) {
      setSellerDetails(selectedOption.seller);
      closeSearchModal();
      openModal();
    }
  };

  const sellerOptions = useMemo(
    () =>
      (validateSeller?.oldSellerData || []).map((seller) => ({
        value: seller.id,
        label: seller.name,
        seller,
      })),
    [validateSeller],
  );

  const formatSellerOption = ({ seller }) => {
    const account = seller?.virtual_account || {};

    return (
      <div className="grid grid-cols-1 gap-2 text-left sm:grid-cols-[1.2fr_0.9fr]">
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {seller?.name}
          </div>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-300">
            {seller?.phone || "--"}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs font-semibold sm:text-right">
          <span className="text-red-500">D {account.total_debit ?? 0}</span>
          <span className="text-gray-700 dark:text-gray-200">
            C {account.total_credit ?? 0}
          </span>
          <span className="text-green-600">B {account.total_balance ?? 0}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-screen rounded-lg">
        {/* -------------- HEADER -------------- */}
        <div className="header flex flex-wrap justify-between items-center gap-3 pt-4 md:pt-6 mx-2">
          <h1 className="text-gray-800 dark:text-gray-200 text-xl md:text-2xl lg:text-3xl font-medium">
            Purchase Bills
          </h1>

          <div className="flex items-center gap-3 justify-content-end">

          <BillFilters
            filters={filters}
            nameOptions={(PurchasingHistory?.sellerNames || []).map((name) => ({
              value: name,
              label: name,
            }))}
            categoryOptions={purchaseCategories.map((category) => ({
              value: category,
              label: category,
            }))}
            selectedCategory={selectedCategory}
            showCategoryFilter={true}
            namePlaceholder="Seller"
            onChange={setFilters}
            onCategoryChange={handleCategoryFilterChange}
            onSearch={handleFiltersSearch}
            onReset={handleResetFilters}
          />
            <button
            onClick={openSearchModal}
            className="inline-block rounded-sm border border-gray-700 bg-gray-600 p-1.5 hover:bg-gray-800 focus:outline-none focus:ring-0"
          >
            <IoAdd size={22} className="text-white" />
          </button>     </div>   </div>

        <p className="w-full bg-gray-300 h-px mt-5"></p>
    

        {selectedCategory === "Base" && <BaseTable filters={appliedFilters} />}
        {selectedCategory === "Lace" && <LaceTable filters={appliedFilters} />}
        {selectedCategory === "Bag/box" && (
          <BagBoxTable filters={appliedFilters} />
        )}
        {selectedCategory === "Accessories" && (
          <AccessoriesTable filters={appliedFilters} />
        )}
        {selectedCategory === "Suits" && <SuitsTable filters={appliedFilters} />}
      </section>

      {/* ALL MODALS  */}
      {selectedCategory === "Base" && (
        <BaseModals
          isOpen={isOpen}
          closeModal={closeModal}
          sellerDetails={sellerDetails}
        />
      )}
      {selectedCategory === "Lace" && (
        <LaceModal
          isOpen={isOpen}
          closeModal={closeModal}
          sellerDetails={sellerDetails}
        />
      )}
      {selectedCategory === "Bag/box" && (
        <BagModal
          isOpen={isOpen}
          closeModal={closeModal}
          sellerDetails={sellerDetails}
        />
      )}
      {selectedCategory === "Accessories" && (
        <AccessoriesModal
          isOpen={isOpen}
          closeModal={closeModal}
          sellerDetails={sellerDetails}
          clearFormData={clearFormData}
        />
      )}
      {selectedCategory === "Suits" && (
        <SuitsModal
          isOpen={isOpen}
          closeModal={closeModal}
          sellerDetails={sellerDetails}
        />
      )}

      {searchModal && (
        <div
          aria-hidden="true"
          className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-screen bg-gray-800 bg-opacity-50"
        >
          <div className="relative py-8 px-4 w-[95%] max-w-3xl max-h-[88vh] bg-white rounded-md shadow dark:bg-gray-700 overflow-visible">
            {/* ------------- HEADER ------------- */}
            <div className="flex items-center justify-between flex-col p-3 rounded-t dark:border-gray-600">
              <h3 className="text-2xl font-medium text-gray-900 dark:text-white">
                Generate Seller
              </h3>
            </div>

            {/* ------------- BODY ------------- */}
            <div className="p-3">
              <div className="flex justify-center items-center gap-x-4">
                <button
                  onClick={swapModal}
                  className="inline-block rounded border border-gray-600 bg-gray-600 px-10 py-2.5 text-sm font-medium text-white hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:ring active:text-indgrayigo-500"
                >
                  New Seller
                </button>
                <button
                  onClick={handleOldSellerClick}
                  className="inline-block rounded border border-gray-600 bg-gray-600 px-10 py-2.5 text-sm font-medium text-white hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:ring active:text-indgrayigo-500"
                >
                  Old Seller
                </button>
              </div>

              {searchUser && (
                <div className="search_user border-t pt-6 mt-6">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      Select Existing Seller
                    </p>
                  </div>

                  {searchLoading ? (
                    <div className="py-6 flex justify-center items-center">
                      <div
                        className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-gray-700 dark:text-gray-100 rounded-full "
                        role="status"
                        aria-label="loading"
                      >
                        <span className="sr-only">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    <AppSelect
                      className="w-full"
                      options={sellerOptions}
                      placeholder="Choose seller"
                      formatOptionLabel={formatSellerOption}
                      noOptionsMessage={() => "No sellers found for this category"}
                      menuPortalTarget={null}
                      menuPosition="absolute"
                      maxMenuHeight={280}
                      onChange={handleChooseSeller}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="button absolute top-3 right-3">
              <button
                onClick={closeSearchModal}
                className="end-2.5 bg-gray-100 text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                type="button"
              >
                <svg
                  aria-hidden="true"
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 14 14"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
                <span className="sr-only">Close modal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PurchaseBills;
