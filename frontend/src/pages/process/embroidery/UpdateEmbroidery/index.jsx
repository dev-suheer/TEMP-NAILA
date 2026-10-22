import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import DesignNumberSection from "./components/DesignNumberSection";
import {
  getAllDesignNumbersAsync,
  GETEmbroiderySIngle,
  getHeadDataByDesignNoAsync,
} from "../../../../features/EmbroiderySlice";
import { GetAllBaseforEmroidery } from "../../../../features/InStockSlice";
import BaseCategorySection from "./components/BaseCategorySection";
import {Badge} from "flowbite-react"
import StatusChip from "../../../../Component/Common/StatusChip";
import PageLoader from "../../../../Component/Loader/PageLoader";

const UpdateEmbroidery = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [designNumberSectionData, setDesignNumberSectionData] = useState(null);
  const { partytype, accountData } = designNumberSectionData || {};

  const { SingleEmbroidery, headStitchData, loading, designNumberLoading } =
    useSelector((state) => state.Embroidery);

  const { loading: EmbroideryBaseLoading } = useSelector(
    (state) => state.InStock
  );

  useEffect(() => {
    dispatch(GETEmbroiderySIngle({ id })).then(async (res) => {
      if (res) {
        await Promise.all([
          dispatch(
            getHeadDataByDesignNoAsync({ design_no: res.payload.design_no })
          ),
          dispatch(getAllDesignNumbersAsync()),
          dispatch(GetAllBaseforEmroidery()),
        ]);
      }
    });
  }, [id, dispatch]);

  const getDesignNumberSectionData = (data) => {
    setDesignNumberSectionData(data);
  };

  const isLoading = loading || designNumberLoading || EmbroideryBaseLoading;

  return (
    <>
      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="relative py-4 px-3 w-full  bg-white rounded-md shadow dark:bg-gray-700 ">
          {/* ------------- HEADER ------------- */}
          <div className="flex items-center justify-start gap-4 p-4 md:p-5 border-b rounded-t dark:border-gray-600">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Update Embroidery Details
            </h3>
             {SingleEmbroidery?.is_verified &&  <Badge color="success">VERIFIED</Badge>}
          </div>
          {/* ACCOUNT DATA */}
          {partytype === "oldParty" && accountData === false ? (
            <div className=" px-3 md:px-6 lg:px-8 py-2 flex flex-wrap justify-around items-center gap-2 border-2 border-red-600 rounded-lg text-green-500 dark:text-green-500  dark:border-red-600">
              <p>Embroidery Data Found But No Bill Generated Yet</p>
            </div>
          ) : (
            <>
              {partytype === "oldParty" && accountData !== null && (
                <div className=" px-3 md:px-6 lg:px-8 py-2 flex flex-wrap justify-around items-center gap-2 border-2 rounded-lg text-gray-900 dark:text-gray-100  dark:border-gray-600">
                  <div className="box text-center">
                    <h3 className="pb-1 font-normal">Total Debit</h3>
                    <h3>{accountData?.total_debit || 0}</h3>
                  </div>
                  <div className="box text-center">
                    <h3 className="pb-1 font-normal">Total Credit</h3>
                    <h3>{accountData?.total_credit || 0}</h3>
                  </div>
                  <div className="box text-center">
                    <h3 className="pb-1 font-normal ">Total Balance</h3>
                    <h3>{accountData?.total_balance || 0}</h3>
                  </div>
                  <div className="box text-center">
                    <h3 className="pb-1 font-normal ">Status</h3>
                    <h3>
                      <StatusChip status={accountData?.status} />
                    </h3>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ------------- SECTIONS------------- */}
          <div className="p-4 md:p-5">
            <div className="space-y-4">
              {/* ------------- DESIGN NUMBER SECTION------------- */}
              <DesignNumberSection
                embroideryData={SingleEmbroidery}
                getData={getDesignNumberSectionData}
              />

              {/* ------------- BASE CATEGORY SECTION------------- */}

            
                <BaseCategorySection
                  designNumberSectionData={designNumberSectionData}
                  DNO_ategory={headStitchData[0]?.shirt}
                  D_NO={headStitchData[0]?.design_no}
                />
            
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UpdateEmbroidery;
