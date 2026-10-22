import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import ReactSearchBox from "react-search-box";
import AppSelect from "../../../../../Component/Common/select/AppSelect";
import { getHeadDataByDesignNoAsync, getPreviousDataBypartyNameAsync } from "../../../../../features/EmbroiderySlice";
import { useDispatch } from "react-redux";
import ThemedSelect from "../../../../../Component/Common/select/ThemedSelect";

const defaultFormData = {
  partyName: "",
  Manual_No: "",
  partytype: "oldParty",
  date: "",
  per_suit: 0,
  rate_per_stitching: "",
  project_status: "",
  design_no: "",
  discount: 0,
  discountType: "",
  T_Quantity_In_m: 0,
  T_Quantity: 0,
  Front_Stitch: { value: 0, head: 0 },
  Bazo_Stitch: { value: 0, head: 0 },
  Gala_Stitch: { value: 0, head: 0 },
  Back_Stitch: { value: 0, head: 0 },
  Pallu_Stitch: { value: 0, head: 0 },
  Trouser_Stitch: { value: 0, head: 0 },
  D_Patch_Stitch: { value: 0, head: 0 },
  F_Patch_Stitch: { value: 0, head: 0 },
  project_status: "",
  accountData:null,
  total:0
};

const DesignNumberSection = ({ embroideryData,getData }) => {
  const dispatch = useDispatch();
  const { designNumbers, previousDataByPartyName } = useSelector(
    (state) => state.Embroidery
  );

  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    if (embroideryData) {
      setFormData({
        ...defaultFormData,
        ...embroideryData,
        partytype: defaultFormData.partytype,
      });
    }
  }, [embroideryData]);

  const designOptions = designNumbers.map((num) => ({
    value: num,
    label: num,
  }));

  const calculateTotal = (formData1) => {
    const rate = parseFloat(formData.rate_per_stitching) || 0;
    const stitches = [
      {
        value: formData1.Front_Stitch.value,
        head: formData1.Front_Stitch.head,
      },
      { value: formData1.Bazo_Stitch.value, head: formData1.Bazo_Stitch.head },
      { value: formData1.Gala_Stitch.value, head: formData1.Gala_Stitch.head },
      { value: formData1.Back_Stitch.value, head: formData1.Back_Stitch.head },
      {
        value: formData1.Pallu_Stitch.value,
        head: formData1.Pallu_Stitch.head,
      },
      {
        value: formData1.Trouser_Stitch.value,
        head: formData1.Trouser_Stitch.head,
      },
      {
        value: formData1.D_Patch_Stitch.value,
        head: formData1.D_Patch_Stitch.head,
      },
      {
        value: formData1.F_Patch_Stitch.value,
        head: formData1.F_Patch_Stitch.head,
      },
    ];

    const total = stitches.reduce((sum, stitch) => {
      const value = parseFloat(stitch.value) || 0;
      const head = parseFloat(stitch.head) || 0;
      const stitchTotal = (value / 1000) * rate * head;
      return sum + stitchTotal;
    }, 0);

    const roundedTotal = Math.round(total * 10000) / 10000;

    return roundedTotal;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const [field, subField] = name.split(".");

    if (subField) {
      setFormData((prevState) => ({
        ...prevState,
        [field]: {
          ...prevState[field],
          [subField]: parseFloat(value),
        },
      }));
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  const handleSelected = (e) => {
    setFormData((prevState) => {
      return {
        ...prevState,
        design_no: e.value,
      };
    });
    dispatch(getHeadDataByDesignNoAsync({ design_no: e.value })).then((res) => {
      const categories = [
        "Front_Stitch",
        "Bazo_Stitch",
        "Gala_Stitch",
        "Back_Stitch",
        "Pallu_Stitch",
        "D_Patch_Stitch",
        "F_Patch_Stitch",
        "Trouser_Stitch",
      ];

      setFormData((prevState) => {
        const updatedData = { ...prevState };
        categories.forEach((item) => {
          if (res.payload[0][item]) {
            updatedData[item] = {
              value: res.payload[0][item].value,
              head: res.payload[0][item].head,
            };
          }
        });
        return updatedData;
      });
    });
  };

  useEffect(() => {
    if (
      formData.rate_per_stitching ||
      formData.discountType ||
      formData.discount
    ) {
      let totalAmount = calculateTotal(formData);
      if (formData.discount !== "" && formData.discountType === "RS") {
        totalAmount = totalAmount - Number(formData.discount);
      } else if (formData.discount !== "" && formData.discountType === "%") {
        const discountAmount = (Number(formData.discount) / 100) * totalAmount;
        totalAmount = totalAmount - discountAmount;
      }
      setFormData(() => ({
        ...formData,
        total:Math.floor(totalAmount)
      }))
    }
  }, [formData.rate_per_stitching, formData.discountType, formData.discount]);

  const togleNameField = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      partyName: value === 'oldParty' ? embroideryData.partyName : "",
      accountData:null,
      partytype:value
    }));
  };

  const handleSearchOldData = (value) => {
    dispatch(getPreviousDataBypartyNameAsync({ partyName: value }));
  };

  const searchResults = previousDataByPartyName?.embroideryData?.map((item) => {
    return {
      key: item.partyName,
      value: item.partyName,
    };
  });

  const handleSelectedRecord = (value) => {
    const Data = previousDataByPartyName?.accountData.find(
      (item) => item.partyName === value
    );
    setFormData((prev) => ({
      ...prev,
      partyName: value,
      accountData: Data?.partyName === value ? Data?.virtual_account : false
    }));
  };

  useEffect(() => {
    getData(formData)
  },[formData])

  return (
    <div className="mb-8 grid items-start grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
      {/* FIRST ROW */}
      <div className="grid items-center h-full grid-cols-4 gap-1">
        <label className="col-span-2 ">
          <input
            type="radio"
            name="partyType"
            value="oldParty"
            className="bg-gray-50 cursor-pointer border mr-2 border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
            onChange={togleNameField}
            required
            defaultChecked
          />
          Old Party
        </label>
        <label className="col-span-2 ">
          <input
            type="radio"
            name="partyType"
            value="newParty"
            className="bg-gray-50 cursor-pointer border mr-2 border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
            onChange={togleNameField}
            required
          />
          New Party
        </label>
      </div>

      <div>
        {formData.partytype === "newParty" ? (
          <input
            name="partyName"
            type="text"
            placeholder="Party Name"
            className="bg-gray-50  border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
            required
            value={formData.partyName}
            onChange={handleInputChange}
          />
        ) : (
          <div className="custom-search-box relative">
            <ReactSearchBox
              key={searchResults?.key}
              onSelect={(value) => handleSelectedRecord(value?.item?.key)}
              placeholder={
                formData.partyName === ""
                  ? "Search Party Name"
                  : formData.partyName
              }
              data={searchResults}
              onChange={(value) => handleSearchOldData(value)}
              inputBorderColor="#D1D5DB"
              inputBackgroundColor="#F9FAFB"
             
            />
            <style jsx>
              {`
                .react-search-box-dropdown {
                  position: absolute;
                  z-index: 50;
                  top: 100%;
                  left: 0;
                  width: 100%;
                  max-height: 250px;
                  overflow-y: auto;
                }
              `}
            </style>
          </div>
        )}
      </div>
      <input
        name="Manual_No"
        type="text"
        placeholder="Manual Number"
        className="bg-gray-50  border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
        required
        value={formData.Manual_No}
        onChange={handleInputChange}
      />
      <div>
        <input
          name="date"
          type="text"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
          required
          value={formData.date.split("T")[0]}
          readOnly
        />
      </div>
      <div className="grid items-start grid-cols-3 gap-1">
        <input
          name="design_no"
          type="text"
          placeholder="Select or Enter D.N"
          className="bg-gray-50 border col-span-2 border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
          required
          value={formData.design_no}
          onChange={handleInputChange}
        />
        <div className="custom-reactSelect">
          <AppSelect className="w-full"
            options={designOptions}
            placeholder=""
            onChange={handleSelected}
            value={
              formData.design_no
                ? {
                    value: formData.design_no,
                  }
                : null
            }
          />
        </div>
      </div>

      {/* SECOND ROW */}
      <div className="grid items-start grid-cols-3 gap-2">
        {/* 1 */}
        <input
          name="Front_Stitch.value"
          type="number"
          placeholder="Front Stitch"
          className="col-span-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
          value={formData.Front_Stitch.value || ""}
          onChange={handleInputChange}
        />
        <input
          name="Front_Stitch.head"
          type="number"
          placeholder="Head"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
          value={formData.Front_Stitch.head || ""}
          onChange={handleInputChange}
        />
      </div>
      {/* 2 */}
      <div className="grid items-start grid-cols-3 gap-2">
        <input
          name="Back_Stitch.value"
          type="number"
          placeholder="Back Stitch"
          className="col-span-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
          value={formData.Back_Stitch.value || ""}
          onChange={handleInputChange}
        />
        <input
          name="Back_Stitch.head"
          type="number"
          placeholder="Head"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
          value={formData.Back_Stitch.head || ""}
          onChange={handleInputChange}
        />
      </div>
      {/* 3 */}
      <div className="grid items-start grid-cols-3 gap-2">
        <input
          name="Bazo_Stitch.value"
          type="number"
          placeholder="Bazu Stitch"
          className="col-span-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
          value={formData.Bazo_Stitch.value || ""}
          onChange={handleInputChange}
        />
        <input
          name="Bazo_Stitch.head"
          type="number"
          placeholder="Head"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
          value={formData.Bazo_Stitch.head || ""}
          onChange={handleInputChange}
        />
      </div>
      {/* 4 */}
      <div className="grid items-start grid-cols-3 gap-2">
        <input
          name="Gala_Stitch.value"
          type="number"
          placeholder="Gala Stitch"
          className="col-span-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
          value={formData.Gala_Stitch.value || ""}
          onChange={handleInputChange}
        />
        <input
          name="Gala_Stitch.head"
          type="number"
          placeholder="Head"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
          value={formData.Gala_Stitch.head || ""}
          onChange={handleInputChange}
        />
      </div>

      {/* THIRD ROW */}
      {/* 5 */}
      <div className="grid items-start grid-cols-3 gap-2">
        <input
          name="D_Patch_Stitch.value"
          type="number"
          placeholder="Dupatta Patch Stitch"
          className="col-span-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
          value={formData.D_Patch_Stitch.value || ""}
          onChange={handleInputChange}
        />
        <input
          name="D_Patch_Stitch.head"
          type="number"
          placeholder="Head"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
          value={formData.D_Patch_Stitch.head || ""}
          onChange={handleInputChange}
        />
      </div>
      {/* 6 */}
      <div className="grid items-start grid-cols-3 gap-2">
        <input
          name="Pallu_Stitch.value"
          type="number"
          placeholder="Pallu Stitch"
          className="col-span-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
          value={formData.Pallu_Stitch.value || ""}
          onChange={handleInputChange}
        />
        <input
          name="Pallu_Stitch.head"
          type="number"
          placeholder="Head"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
          value={formData.Pallu_Stitch.head || ""}
          onChange={handleInputChange}
        />
      </div>
      {/* 7 */}
      <div className="grid items-start grid-cols-3 gap-2">
        <input
          name="F_Patch_Stitch.value"
          type="number"
          placeholder="Front Patch Stitch"
          className="col-span-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
          value={formData.F_Patch_Stitch.value || ""}
          onChange={handleInputChange}
        />
        <input
          name="F_Patch_Stitch.head"
          type="number"
          placeholder="Head"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
          value={formData.F_Patch_Stitch.head || ""}
          onChange={handleInputChange}
        />
      </div>

      {/* 8 */}
      <div className="grid items-start grid-cols-3 gap-2">
        <input
          name="Trouser_Stitch.value"
          type="number"
          placeholder="Trouser Stitch"
          className="col-span-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
          value={formData.Trouser_Stitch.value || ""}
          onChange={handleInputChange}
        />
        <input
          name="Trouser_Stitch.head"
          type="number"
          placeholder="Head"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
          value={formData.Trouser_Stitch.head || ""}
          onChange={handleInputChange}
        />
      </div>

      {/* FOURTH ROW */}
      <div>
        <input
          name="rate_per_stitching"
          type="number"
          placeholder="Rate Per Stitch"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
          required
          value={formData.rate_per_stitching || ""}
          onChange={handleInputChange}
        />
      </div>

      {/* DISCOUNT FIELDS */}
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <div className="flex">
            <input
              name="discount"
              type="number"
              placeholder="Enter Discount"
              className="bg-gray-50 border rounded-tl-md rounded-bl-md border-gray-300 text-gray-900 text-sm focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
              value={formData.discount || ""}
              onChange={handleInputChange}
              required
            />
            <ThemedSelect variant="suffix" className="w-20 shrink-0"
              name="discountType"
              value={formData.discountType}
              onChange={handleInputChange}
            >
              <option value="RS">RS</option>
              <option value="%">%</option>
            </ThemedSelect>
          </div>
        </div>
      </div>

      {/* TOTAL AFTER DISCOUNT */}
      <div>
        <input
          type="text"
          value={formData.rate_per_stitching ? formData.total : 0}
          readOnly
          name="per_suit"
          className="bg-gray-50 border-2 border-green-600  text-gray-900 text-sm rounded-md focus:ring-0 focus:border-green-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
        />
      </div>
    </div>
  );
};

export default DesignNumberSection;
