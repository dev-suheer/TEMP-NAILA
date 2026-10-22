import { useEffect, useState } from "react";
import { IoAdd } from "react-icons/io5";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaEye, FaTrashAlt, FaUndo } from "react-icons/fa";
import {
  CreateEmployee,
  GetEmployeeActive,
  GetEmployeePast,
  UpdateEmployee,
} from "../../features/AccountSlice";
import Pagination from "../../Component/Common/Pagination";
import { buildPaginationQuery, getPageLimit } from "../../Utils/Common";
import Icon from "../../Component/Common/Icons";
import ConfirmationModal from "../../Component/Modal/ConfirmationModal";
import PageLoader from "../../Component/Loader/PageLoader";
import ButtonSpinner from "../../Component/Common/button/ButtonSpinner";

const categories = ["Active Employee", "Past Employee"];

const emptyEmployeeFormData = {
  name: "",
  father_Name: "",
  CNIC: "",
  phone_number: "",
  address: "",
  father_phone_number: "",
  last_work_place: "",
  designation: "",
  salary: "",
  joininig_date: "",
};

const formatDateForInput = (date) => {
  if (!date) return "";

  return String(date).slice(0, 10);
};

const mapEmployeeToFormData = (employee = {}) => ({
  ...emptyEmployeeFormData,
  name: employee.name ?? "",
  father_Name: employee.father_Name ?? "",
  CNIC: employee.CNIC ?? "",
  phone_number: employee.phone_number ?? "",
  address: employee.address ?? "",
  father_phone_number: employee.father_phone_number ?? "",
  last_work_place: employee.last_work_place ?? "",
  designation: employee.designation ?? "",
  salary: employee.salary ?? "",
  joininig_date: formatDateForInput(employee.joininig_date),
});

const Employee = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [search, setSearch] = useState();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("Active Employee");
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [restoreConfirmationOpen, setRestoreConfirmationOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = getPageLimit(searchParams);

  const { loading, ActiveEmployees, PastEmployees, employeEditLoading } =
    useSelector((state) => state.Account);

  useEffect(() => {
    if (selectedCategory === "Active Employee") {
      dispatch(GetEmployeeActive({ search: search || "", page, limit }));
    } else {
      dispatch(GetEmployeePast({ search: search || "", page, limit }));
    }
  }, [dispatch, page, limit, selectedCategory, search]);

  const Employees =
    selectedCategory === "Active Employee" ? ActiveEmployees : PastEmployees;

  const [formData, setFormData] = useState(emptyEmployeeFormData);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    navigate(`/dashboard/employee${buildPaginationQuery(searchParams, { page: 1, limit })}`);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      const updatedFormData = {
        ...formData,
        id: selectedEmployee?.id || selectedEmployee?._id,
      };

      dispatch(UpdateEmployee(updatedFormData)).then((res) => {
        if (res.payload.success === true) {
          dispatch(GetEmployeeActive({ search: search || "", page, limit }));
          closeModal();
          setIsEditing(false);
        }
      });
    } else {
      dispatch(CreateEmployee(formData)).then((res) => {
        if (res.payload.success === true) {
          console.log('executing');
          dispatch(GetEmployeeActive({ search: search || "", page, limit }));
          closeModal();
        }
      });
    }
  };

  const handleEdit = (employee) => {
    setFormData(mapEmployeeToFormData(employee));
    setSelectedEmployee(employee);
    setIsEditing(true);
    openModal();
  };

  const handleDelete = (id) => {
    const data = {
      id: id,
      pastEmploye: true,
    };
    dispatch(UpdateEmployee(data)).then(() => {
      dispatch(GetEmployeeActive({ search: search || "", page, limit }));

      closeConfirmationModal();
    });
  };

  const handleRestore = (id) => {
    const data = {
      id,
      pastEmploye: false,
    };

    dispatch(UpdateEmployee(data)).then(() => {
      dispatch(GetEmployeePast({ search: search || "", page, limit }));
      closeRestoreConfirmationModal();
    });
  };

  const openModal = () => {
    setIsOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setIsOpen(false);
    document.body.style.overflow = "auto";
    setIsEditing(false);
    setSelectedEmployee(null);
    setFormData(emptyEmployeeFormData);
  };

  const openConfirmationModal = (employee) => {
    setIsConfirmationOpen(true);
    setSelectedEmployee(employee);

    document.body.style.overflow = "hidden";
  };

  const closeConfirmationModal = () => {
    setIsConfirmationOpen(false);
    document.body.style.overflow = "auto";
  };

  const openRestoreConfirmationModal = (employee) => {
    setRestoreConfirmationOpen(true);
    setSelectedEmployee(employee);
    document.body.style.overflow = "hidden";
  };

  const closeRestoreConfirmationModal = () => {
    setRestoreConfirmationOpen(false);
    setSelectedEmployee(null);
    document.body.style.overflow = "auto";
  };




  const handleCategoryClick = (category) => {
    if (category !== selectedCategory) {
      setSelectedCategory(category);
      setSearch("");

      navigate(`/dashboard/employee${buildPaginationQuery(searchParams, { page: 1, limit })}`);
    }
  };


  return (
    <>
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-[70vh] rounded-lg">
        {/* HEADER */}
        <div className="header flex flex-wrap justify-between items-center gap-3 pt-4 md:pt-6 mx-2">
          <h1 className="text-gray-800 dark:text-gray-200 text-xl md:text-2xl lg:text-3xl font-medium">
            Employees
          </h1>

          {/* SEARCH BAR */}
          <div className="search_bar flex items-center gap-3 mr-2">
            <div className="relative mt-4 md:mt-0">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg
                  className="w-5 h-5 text-gray-800 dark:text-gray-200"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
              </span>
              <input
                type="text"
                className="md:w-64 lg:w-72 py-2 pl-10 pr-4 text-gray-800 dark:text-gray-200 bg-transparent border border-[#D9D9D9] rounded-lg focus:border-[#D9D9D9] focus:outline-none focus:ring focus:ring-opacity-40 focus:ring-[#D9D9D9] placeholder:text-sm dark:placeholder:text-gray-300"
                placeholder="Search by name"
                value={search}
                onChange={handleSearch}
              />
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="tabs flex flex-wrap justify-between items-center gap-3 my-5">
          <div className="tabs_button flex flex-wrap gap-1">
            {categories?.map((category) => (
              <button
                key={category}
                className={`border border-gray-500 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-5 py-2 mx-2 text-sm rounded-md transition-colors duration-300 ${
                  selectedCategory === category
                    ? "bg-[#252525] text-white dark:bg-white dark:text-gray-900"
                    : "hover:bg-gray-100 dark:hover:bg-gray-600"
                }`}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <button
            onClick={openModal}
            className="inline-block rounded-sm border border-gray-700 bg-gray-600 p-1.5 hover:bg-gray-800 focus:outline-none focus:ring-0"
          >
            <IoAdd size={22} className="text-white" />
          </button>
        </div>

        {loading ? (
          <PageLoader />
        ) : (
          <>
            <div className="relative overflow-x-auto mt-5">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                  <tr>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                      {" "}
                      Name
                    </th>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                      Salary
                    </th>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                      Advance
                    </th>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                      Balance
                    </th>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                      Details
                    </th>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Employees?.employData &&
                  Employees?.employData?.length > 0 ? (
                    Employees?.employData?.map((employee, index) => (
                      <tr
                        key={index}
                        className="bg-white border-b text-md font-semibold dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      >
                        <th
                          className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                          scope="row"
                        >
                          <p>{employee.name}</p>
                        </th>

                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                          {employee.salary} Rs
                        </td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                          {employee?.advance} Rs
                        </td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                          {employee?.balance} Rs
                        </td>
                        <td className="pl-4 md:pl-6 lg:pl-10 py-2 md:py-3 lg:py-4">
                          <Link
                            to={`/dashboard/employee-details/${employee.id}`}
                          >
                            <FaEye size={20} className="cursor-pointer" />
                          </Link>
                        </td>
                        {selectedCategory === "Active Employee" && (
                          <td className="pl-4 md:pl-6 lg:pl-10 py-2 md:py-3 lg:py-4 flex gap-2 mt-2">                          
                            <Icon
                              name="edit"
                              size={20}
                              className="cursor-pointer"
                              onClick={() => handleEdit(employee)}
                            />
                            <FaTrashAlt
                              size={20}
                              className=" text-red-500 cursor-pointer"
                              onClick={() => openConfirmationModal(employee)}
                            />
                          </td>
                        )}
                        {selectedCategory === "Past Employee" && (
                          <td className="pl-4 md:pl-6 lg:pl-10 py-2 md:py-3 lg:py-4">
                            <FaUndo
                              size={20}
                              className="cursor-pointer text-green-600"
                              title="Move to active"
                              onClick={() => openRestoreConfirmationModal(employee)}
                            />
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr className="w-full text-md font-semibold dark:text-white">
                      <td
                        colSpan={6}
                        className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-center text-xs md:text-sm"
                      >
                        No employees found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <Pagination
        currentPage={page}
        totalPages={Employees?.totalPages}
        totalRecords={Employees?.totalRecords}
        pageSize={limit}
      />

      {/* Modal */}
      {isOpen && (
        <div
          aria-hidden="true"
          className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full min-h-screen bg-gray-800 bg-opacity-50"
        >
          <div className="relative py-4 px-3 w-[95%] max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-md shadow dark:bg-gray-700">
            {/* ------------- HEADER ------------- */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Employee Form
              </h3>
              <button
                onClick={closeModal}
                className="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
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

            {/* ------------- BODY ------------- */}
            <div className="p-4 md:p-5">
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* FIRST ROW */}
                <div className="mb-5 grid items-start grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                  {/* NAME */}
                  <div>
                    <input
                      type="text"
                      placeholder="Name"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>

                  {/* FATHER NAME */}
                  <div>
                    <input
                      type="text"
                      placeholder="Father Name"
                      name="father_Name"
                      id="father_Name"
                      value={formData.father_Name}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>

                  {/* CNIC */}
                  <div>
                    <input
                      type="text"
                      placeholder="CNIC"
                      name="CNIC"
                      id="CNIC"
                      value={formData.CNIC}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="mb-8 grid items-start grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                  {/* PHONE NUMBER */}
                  <div>
                    <input
                      type="number"
                      placeholder="Phone Number"
                      name="phone_number"
                      id="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>

                  {/* ADDRESS */}
                  <div>
                    <input
                      type="text"
                      name="address"
                      id="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Address"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>

                  {/* FATHER CNIC */}
                  <div>
                    <input
                      type="number"
                      placeholder="Father CNIC"
                      name="father_phone_number"
                      id="father_phone_number"
                      value={formData.father_phone_number}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>

                  {/* LAST WORK PLACE */}
                  <div>
                    <input
                      type="text"
                      placeholder="Last Work Place"
                      name="last_work_place"
                      id="last_work_place"
                      value={formData.last_work_place}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>
                </div>

                {/* LAST ROW */}
                <div className="mb-5 grid items-start grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                  {/* DESIGNATION */}
                  <div>
                    <input
                      type="text"
                      placeholder="Designation"
                      name="designation"
                      id="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>

                  {/* SALARY */}
                  <div>
                    <input
                      type="number"
                      placeholder="Salary"
                      name="salary"
                      id="salary"
                      value={formData.salary}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>

                  {/* JOINING DATE */}
                  <div>
                    <input
                      type="date"
                      placeholder="Joining Date"
                      name="joininig_date"
                      id="joininig_date"
                      value={
                        formData?.joininig_date 
                          ? formData.joininig_date
                          : ""
                      }
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-center pt-2">
                  {employeEditLoading ? (
                    <button
                      type="submit"
                      disabled
                      className="inline-flex items-center justify-center gap-2 cursor-not-allowed rounded border border-gray-400 bg-gray-400 dark:bg-gray-500 px-10 py-2.5 text-sm font-medium text-white hover:bg-gray-400 hover:text-gray-100 focus:outline-none focus:ring active:text-indgrayigo-500"
                    >
                      <ButtonSpinner />
                      {isEditing ? "Update" : "Create"}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="inline-block rounded border border-gray-600 bg-gray-600 dark:bg-gray-500 px-10 py-2.5 text-sm font-medium text-white hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:ring active:text-indgrayigo-500"
                    >
                      {isEditing ? "Update" : "Create"}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isConfirmationOpen && (
        <div
          aria-hidden="true"
          className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full min-h-screen bg-gray-800 bg-opacity-50"
        >
          <div className="relative py-4 px-3 w-[95%] max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-md shadow dark:bg-gray-700">
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Delete Employee
              </h3>
              <button
                onClick={closeConfirmationModal}
                className="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
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

            <div className="p-4 md:p-5">
              <p className="text-center text-gray-700 dark:text-gray-300">
                Are you sure you want to Delete the Employee?
              </p>
              <div className="flex justify-center pt-5 gap-3">
                <button
                  onClick={() => handleDelete(selectedEmployee.id)}
                  className="inline-block rounded  bg-red-600 dark:bg-gray-500 px-10 py-2.5 text-sm font-medium text-white hover:bg-red-600 hover:text-gray-100 focus:outline-none focus:ring"
                >
                  Yes
                </button>
                <button
                  onClick={closeConfirmationModal}
                  className="inline-block rounded border border-gray-300 bg-gray-300 dark:bg-gray-400 px-10 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-400 focus:outline-none focus:ring"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {restoreConfirmationOpen && (
        <ConfirmationModal
          onClose={closeRestoreConfirmationModal}
          onConfirm={() => handleRestore(selectedEmployee?.id)}
          message={"Are you sure you want to move this employee back to active?"}
          title={"Restore Employee"}
          updateStitchingLoading={employeEditLoading}
        />
      )}
    </>
  );
};

export default Employee;
