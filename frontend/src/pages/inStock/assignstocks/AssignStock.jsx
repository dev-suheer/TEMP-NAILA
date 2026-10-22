import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AssginStocktoBranch } from "../../../features/InStockSlice";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ThemedSelect from "../../../Component/Common/select/ThemedSelect";
import ButtonSpinner from "../../../Component/Common/button/ButtonSpinner";

const AssignStock = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { Branches, stockLoading } = useSelector((state) => state.InStock);
  const { user } = useSelector((state) => state.auth);
  const [selectedItems, setSelectedItems] = useState(
    () => JSON.parse(localStorage.getItem("selectedSuits")) || []
  );
  const [rawBundlesData, setRawBundlesData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    branchId: user?.user?.branchId || "",
    bundles: [],
    note:""
  });

  const handleBranchChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      branchId: e.target.value,
    }));
  };

  const handleRemoveItem = (index) => {
    const updatedItems = selectedItems.filter((_, i) => i !== index);
    setSelectedItems(updatedItems);
    localStorage.setItem("selectedSuits", JSON.stringify(updatedItems));
  };

  const handleAssignQuantityChange = (index, value) => {
    const updatedItems = [...selectedItems];
    updatedItems[index] = {
      ...updatedItems[index],
      assignQuantity: value === "" ? null : Number(value),
    };

    setSelectedItems(updatedItems);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.branchId === "") {
      toast.error("Please select a branch");
      return;
    }
    dispatch(AssginStocktoBranch(formData)).then((res) => {
      if (res.payload.success === true) {
        navigate("/dashboard/suits");
        setFormData({
          branchId: "",
          bundles: [],
          note:""
        });
        localStorage.setItem("selectedSuits", JSON.stringify([]));
      }
    });
  };

  const handleAddInBundle = (item) => {
    const suitDataForBundle = {
      Item_Id: item._id,
      category: item.category,
      color: item.color,
      stitch_type: item.stitch_type,
      quantity: item?.assignQuantity,
      cost_price: item.cost_price,
      sale_price: item.sale_price,
      d_no: item.d_no,
    };
    setRawBundlesData((prev) => [...prev, suitDataForBundle]);
  };

  const handleCreateBundle = () => {
    setFormData((prev) => ({
      ...prev,
      bundles: [...formData.bundles, rawBundlesData],
    }));
    setRawBundlesData([]);
  };

  const viewCreatedBundles = () => {
    setIsModalOpen(true);
  };

  const handleRemoveBundle = (index) => {
    const updatedBundlesData = formData.bundles.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      bundles: updatedBundlesData,
    }));
  };

    const getSingleBundlesQuantity = (data) => {
    const singleBundleQuantitySum = data?.reduce((acc,record) => {
      let totalSum = 0
        totalSum += record.quantity
      acc.singleBundleQuantitySum += totalSum;
    return acc;

    },{   
      singleBundleQuantitySum:0
    });
    return singleBundleQuantitySum
  };

   const getALLBundlesQuantity = (data) => {
    const allBundlesQuantitySum = data?.reduce((acc,record) => {
      let totalSum = 0
      record.forEach((item) => {
        totalSum += item.quantity
      })
      acc.allBundlesQuantitySum += totalSum;
    return acc;

    },{   
      allBundlesQuantitySum:0
    });
    return allBundlesQuantitySum
  };

  return (
    <>
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-screen rounded-lg">
        <h1 className="text-gray-800 dark:text-gray-200 text-xl md:text-2xl lg:text-3xl font-medium">
          Send Stock To Branch
        </h1>

        <div className="flex justify-end gap-4 items-center pt-6">
          <button
            onClick={handleCreateBundle}
            disabled={rawBundlesData.length === 0}
            className={`flex items-center justify-center gap-3 px-4 py-2.5 text-sm rounded 
    ${
      rawBundlesData.length > 0
        ? "bg-[#252525] dark:bg-gray-200 text-white dark:text-gray-800"
        : "bg-gray-400 text-gray-200 cursor-not-allowed"
    }`}
          >
            Create Bundle
          </button>

          <button
            onClick={viewCreatedBundles}
            disabled={formData?.bundles?.length === 0}
            className={`flex items-center justify-center gap-3 px-4 py-2.5 text-sm rounded 
    ${
      formData?.bundles?.length > 0
        ? "bg-[#252525] dark:bg-gray-200 text-white dark:text-gray-800"
        : "bg-gray-400 text-gray-200 cursor-not-allowed"
    }`}
          >
            View Bundles
          </button>
          <ThemedSelect className="w-48"
            id="branches"
            value={formData.branchId}
            onChange={handleBranchChange}
          >
            <option value="" disabled>
              Choose Branch
            </option>
            {Branches?.map((data) => (
              <option key={data?.id} value={data?.id}>
                {data?.branchName}
              </option>
            ))}
          </ThemedSelect>
        </div>

        <div className="relative overflow-x-auto mt-5">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
              <tr>
                <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center lg:py-3 text-xs md:text-sm">CheckBox</th>
                <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm">D # No</th>
                <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm">Category</th>
                <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm">Colors</th>
                <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm">Type</th>
                <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm">SKU</th>
                <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm">Quantity</th>
                <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm">Cost Prices</th>
                <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm">Sales Prices</th>
                <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm">Send Quantity</th>
                <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-center text-xs md:text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {selectedItems.length > 0 ? (
                selectedItems.map((data, index) => (
                  <tr
                    key={index}
                    className="bg-white border-b text-md font-medium dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  >
                    <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center lg:py-4 text-xs md:text-sm">
                      <button
                        onClick={() => handleAddInBundle(data)}
                        disabled={data.assignQuantity <= 0}
                        className={`px-2 py-1 text-sm rounded 
    ${
      data.assignQuantity > 0
        ? "bg-[#252525] dark:bg-gray-200 text-white dark:text-gray-800"
        : "bg-gray-400 text-gray-200 cursor-not-allowed"
    }`}
                      >
                        Add In Bundle
                      </button>
                    </td>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm" scope="row">
                      {data.d_no}
                    </th>
                    <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.category}</td>
                    <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.color}</td>
                    <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.stitch_type}</td>
                    <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.sku}</td>
                    <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                      {data.quantity}/T-{data.TotalQuantity}
                    </td>
                    <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.cost_price}</td>
                    <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.sale_price}</td>
                    <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                      <input
                        type="number"
                        required
                        placeholder="0"
                        value={data.assignQuantity}
                        onChange={(e) =>
                          handleAssignQuantityChange(index, e.target.value)
                        }
                        className="border border-gray-300 outline-none focus:outline-none focus:ring-0 focus:border-gray-900 rounded-md px-2 py-1 w-20 text-gray-700"
                      />
                    </td>
                    <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-center text-xs md:text-sm">
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="end-2.5 text-red-500 bg-transparent hover:bg-gray-200 hover:text-red-500 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                      >
                        <svg
                          aria-hidden="true"
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 14 14"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M1 1l6 6m0 0l6 6M7 7l6-6M7 7L1 13"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          />
                        </svg>
                        <span className="sr-only">Remove item</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="w-full flex justify-center items-center">
                  <td className="text-xl mt-3" colSpan="8">
                    No Data Available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <textarea
           className="w-1/3 mx-6 mt-6 border border-gray-300 dark:border-gray-600 rounded-md  py-2 text-gray-800 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none"
          placeholder="Enter your note"
          value={formData.note}
          onChange={(e) => setFormData((prev) => ({
            ...prev,
            note: e.target.value,
          }))}
          >

          </textarea>
        </div>

        {selectedItems.length > 0 && (
          <div className="flex justify-center pt-6">
            {stockLoading ? (
              <button
                disabled
                className="inline-flex items-center justify-center gap-2 cursor-progress rounded border border-gray-600 bg-gray-300 px-10 py-2.5 text-sm font-medium text-white focus:outline-none focus:ring"
              >
                <ButtonSpinner />
                Send Stock
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="inline-block rounded border border-gray-600 bg-gray-600 px-10 py-2.5 text-sm font-medium text-white hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:ring"
              >
                Send Stock
              </button>
            )}
          </div>
        )}
      </section>

      {isModalOpen && formData?.bundles?.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-4xl max-h-[80%] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Created Bundles | Total Quantity: {getALLBundlesQuantity(formData?.bundles)?.allBundlesQuantitySum}</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-red-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>
            {formData.bundles.map((bundle, index) => (
              <div key={index} className="mb-6 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Bundle {index + 1} | Quantity : {getSingleBundlesQuantity(bundle).singleBundleQuantitySum}
                  </h3>
                  <button
                    onClick={() => handleRemoveBundle(index)}
                    className="end-2.5 mb-2 text-red-500 bg-transparent hover:bg-gray-200 hover:text-red-500 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                  >
                    <svg
                      aria-hidden="true"
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 14 14"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1 1l6 6m0 0l6 6M7 7l6-6M7 7L1 13"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                    <span className="sr-only">Remove item</span>
                  </button>
                </div>

                <table className="w-full text-sm text-left text-gray-600 border">
                  <thead className="bg-gray-100 text-gray-800">
                    <tr>
                      <th className="px-4 py-2">D No</th>
                      <th className="px-4 py-2">Category</th>
                      <th className="px-4 py-2">Color</th>
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2">Quantity</th>
                      <th className="px-4 py-2">Cost Price</th>
                      <th className="px-4 py-2">Sale Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bundle.map((item, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-4 py-2">{item.d_no}</td>
                        <td className="px-4 py-2">{item.category}</td>
                        <td className="px-4 py-2">{item.color}</td>
                        <td className="px-4 py-2">{item.stitch_type}</td>
                        <td className="px-4 py-2">{item.quantity}</td>
                        <td className="px-4 py-2">{item.cost_price}</td>
                        <td className="px-4 py-2">{item.sale_price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default AssignStock;
