import { useCallback, useEffect, useState } from "react";
import moment from "moment";
import { IoClose } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import {
  GetAttendencedataAsync,
  UpdateBulkAttendencedataAsync,
  UpdateAttendencedataAsync,
} from "../../features/AccountSlice";
import Loading from "../../Component/Loader/Loading";
import toast from "react-hot-toast";
import { Button } from "../../Component/Common/button/Button";
import { getTodayDate, toUtcISOString } from "../../Utils/Common";

const ATTENDANCE_STATUSES = ["present", "absent", "leave"];

const Attendance = () => {
  const today = getTodayDate();
  const dispatch = useDispatch();
  const { attendanceData, getAttendaceLoading, updateAttendanceLoading} = useSelector(
    (state) => state.Account);
  const [currentDate, setCurrentDate] = useState(moment(today));
  const month = currentDate.format("YYYY-MM");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedBulkEmployees, setSelectedBulkEmployees] = useState([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkDate, setBulkDate] = useState("");
  const [bulkForms, setBulkForms] = useState({});
  const [formData, setFormData] = useState({
    status: "",
    check_in: "",
    check_out: "",
    overtime_hours: "0",
    employee_id: "",
    date: "",
    is_weekly_holiday: false,
    is_public_holiday: false,
    note: "",
  });

  useEffect(() => {
    dispatch(GetAttendencedataAsync({ month }));
    setSelectedBulkEmployees([]);
    setIsBulkModalOpen(false);
  }, [dispatch, currentDate, month]);


    const getDateMeta = (dateValue) => {
    const selectedDate = moment(dateValue);
    const holidayData = publicHolidays?.find(
      (item) => item.date === selectedDate.format("YYYY-MM-DD"),
    );
    return {
      date: selectedDate,
      isSunday: selectedDate.day() === 0,
      isPublicHoliday: Boolean(holidayData),
      holidayData,
    };
  };

  const daysInMonth = currentDate.daysInMonth();
  const publicHolidays = attendanceData?.publicHolidays || [];

  const getDaysDataForMonth = useCallback(() => {
    let data = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = currentDate.clone().date(day);
      const {isPublicHoliday,isSunday, holidayData} = getDateMeta(date)
      const dayData = {
        number: day,
        day: date.format("ddd"),
        isSunday,
        date: date,
        isPublicHoliday,
        ...(isPublicHoliday && { holidayData: holidayData }),
      };
      data.push(dayData);
    }
    return data;
  }, [publicHolidays,currentDate]);

  const tableHeaderData = getDaysDataForMonth();
  const tableData = attendanceData.data;


  const withUtcAttendanceDates = (data) => ({
    ...data,
    date: toUtcISOString(data.date),
    ...(data.check_in && { check_in: toUtcISOString(data.check_in) }),
    ...(data.check_out && { check_out: toUtcISOString(data.check_out) }),
  });

  const getDefaultBulkDate = () => {
    const todayMoment = moment(today);
    return currentDate.isSame(todayMoment, "month")
      ? todayMoment.format("YYYY-MM-DD")
      : currentDate.clone().date(1).format("YYYY-MM-DD");
  };

  const getEmployeeAttendanceForDate = (employee, dateValue) =>
    employee?.attendanceRecords?.find((attendanceRecord) =>
      moment(attendanceRecord.date).isSame(dateValue, "day"),
    );

    const getCheckin = (isToday,date) => {
      return isToday ? moment().format("YYYY-MM-DDTHH:mm") : `${date}T09:00`
    };

    const getCheckout = (isToday,date) => {
      return isToday ? moment().add(12,"h").format("YYYY-MM-DDTHH:mm") : `${date}T21:00`
    };

  const createBulkForm = (employee, dateValue) => {
    const dateKey = moment(dateValue).format("YYYY-MM-DD");
    const dateMeta = getDateMeta(dateKey);
    const record = getEmployeeAttendanceForDate(employee, dateKey);
    const isToday = dateKey === today;


    if (record) {
      return {
        status: record.status,
        check_in: record.check_in
          ? moment(record.check_in).format("YYYY-MM-DDTHH:mm")
          : getCheckin(isToday, dateKey),
        check_out: record.check_out
          ? moment(record.check_out).format("YYYY-MM-DDTHH:mm")
          : getCheckout(isToday, dateKey),
        overtime_hours: record.overtime_hours || "0",
        employee_id: employee.id,
        employee_name: employee.name,
        designation: employee.designation,
        date: record.date,
        is_weekly_holiday: record.is_weekly_holiday,
        is_public_holiday: record.is_public_holiday,
        note: record.note || "",
      };
    }

    return {
      status: "present",
      check_in: getCheckin(isToday,dateKey),
      check_out: getCheckout(isToday,dateKey),
      overtime_hours: "0",
      employee_id: employee.id,
      employee_name: employee.name,
      designation: employee.designation,
      date: `${dateKey}T00:00`,
      is_weekly_holiday: dateMeta.isSunday,
      is_public_holiday: dateMeta.isPublicHoliday,
      note: "",
    };
  };

  const toggleBulkEmployee = (employee) => {
    setSelectedBulkEmployees((prev) => {
      const exists = prev.some((item) => item.id === employee.id);
      if (exists) {
        return prev.filter((item) => item.id !== employee.id);
      }
      return [...prev, employee];
    });
  };

  const isBulkEmployeeSelected = (employeeId) =>
    selectedBulkEmployees.some((employee) => employee.id === employeeId);

  const openBulkAttendanceModal = () => {
    const defaultDate = getDefaultBulkDate();
    setBulkDate(defaultDate);
    setBulkForms(
      selectedBulkEmployees.reduce((acc, employee) => {
        acc[employee.id] = createBulkForm(employee, defaultDate);
        return acc;
      }, {}),
    );
    setIsBulkModalOpen(true);
  };

  const closeBulkAttendanceModal = () => {
    setIsBulkModalOpen(false);
    setBulkForms({});
  };

  const handleBulkDateChange = (e) => {
    const value = e.target.value;
    setBulkDate(value);
    setBulkForms(
      selectedBulkEmployees.reduce((acc, employee) => {
        acc[employee.id] = createBulkForm(employee, value);
        return acc;
      }, {}),
    );
  };

  const handleBulkFormChange = (employeeId, e) => {
    const { name, value } = e.target;
    setBulkForms((prev) => {
      const currentForm = prev[employeeId];
      const newFormData = { ...currentForm, [name]: value };

      if (name === "note") {
        return { ...prev, [employeeId]: newFormData };
      }

      if (newFormData.status === "present") {
        const start = moment(newFormData.check_in, "YYYY-MM-DDTHH:mm");
        const end = moment(newFormData.check_out, "YYYY-MM-DDTHH:mm");
        if (!start.isValid() || !end.isValid() || end.isSameOrBefore(start)) {
          toast.error("Invalid shift time: Check-out must be after Check-in.");
          return prev;
        }
        const duration = end.diff(start, "hours") - 12;
        newFormData.overtime_hours = duration.toFixed(1);
      } else {
        newFormData.overtime_hours = "0";
      }

      return { ...prev, [employeeId]: newFormData };
    });
  };

  const saveBulkAttendance = async () => {
    const records = selectedBulkEmployees.map((employee) => {
      const data = bulkForms[employee.id];
      if (data.status !== "present") {
        return {
          employee_id: data.employee_id,
          date: toUtcISOString(data.date),
          status: data.status,
          is_weekly_holiday: data.is_weekly_holiday,
          is_public_holiday: data.is_public_holiday,
          note: data.note,
        };
      }
      return withUtcAttendanceDates(data);
    });

    await dispatch(UpdateBulkAttendencedataAsync({ records })).then((res) => {
      if (res.payload?.success) {
        dispatch(GetAttendencedataAsync({ month }));
        setSelectedBulkEmployees([]);
        closeBulkAttendanceModal();
      }
    });
  };

  const handleCellClick = (employee, day, record) => {
    const status = record?.status || "";
    const ot = record?.overtime_hours || 0;
    const isSunday = day.isSunday;
    const note = record?.note || "";
    const date = moment(day.date).format("YYYY-MM-DD")
    const isToday = date === today;

    setSelectedCell({ employee, day, record });

    if (record?.status === "present") {
      setFormData({
        status: status,
        check_in: moment(record.check_in).format("YYYY-MM-DDTHH:mm"),
        check_out:moment(record.check_out).format("YYYY-MM-DDTHH:mm"),
        overtime_hours: ot,
        employee_id: employee.id,
        is_weekly_holiday: isSunday,
        is_public_holiday: day.isPublicHoliday,
        note: note,
        date: record.date
      });
    } else {
      setFormData({
        status: !record ? "leave" : status,
        check_in: getCheckin(isToday,date),
        check_out:  getCheckout(isToday,date),
        overtime_hours: ot,
        employee_id: employee.id,
        is_weekly_holiday: isSunday,
        is_public_holiday: day.isPublicHoliday,
        note: note,
        date: moment(day.date).format("YYYY-MM-DDTHH:mm")
      });
    }

    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if(name === 'note') {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
      return;
    }
    const newFormData = { ...formData, [name]: value };

    if (newFormData.status === "present") {
      const start = moment(newFormData.check_in, "YYYY-MM-DDTHH:mm");
      const end = moment(newFormData.check_out, "YYYY-MM-DDTHH:mm");
      if (!start.isValid() || !end.isValid() || end.isSameOrBefore(start)) {
        toast.error("Invalid shift time: Check-out must be after Check-in.");
        return;
      }
      let duration = end.diff(start, "hours");
      duration = duration - 12
      newFormData.overtime_hours = duration.toFixed(1);
    } else {
      newFormData.overtime_hours = "0";
    }

    setFormData(newFormData);
  };

  const saveAttendance = async () => {

    let payload = withUtcAttendanceDates(formData);
    if(formData.status !== 'present') {
      payload = {
        status: formData.status,
        date: toUtcISOString(formData.date),
        employee_id: formData.employee_id,
        note: formData.note
      }
    }
    await dispatch(
      UpdateAttendencedataAsync(payload),
    ).then((res) => {
      if(res.payload.success) {
         dispatch(GetAttendencedataAsync({month}));
         setIsModalOpen(false);
      }
    });
   
  };

  if (getAttendaceLoading) {
    return (
       <div className="flex justify-center items-center h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#f3f4f6] min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Employee Monthly Attendance & Overtime
          </h1>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {currentDate.format("MMMM YYYY")}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-cyan-100 ring-1 ring-cyan-200" />
                Weekly holiday
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-violet-100 ring-1 ring-violet-200" />
                Public holiday
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-green-100 ring-1 ring-green-200" />
                Present
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-red-100 ring-1 ring-red-200" />
                Absent
              </span>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {selectedBulkEmployees.length > 0 && (
              <div className="mr-2 flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 shadow-sm">
                <span className="text-sm font-semibold text-gray-700">
                  {selectedBulkEmployees.length} selected
                </span>
                <Button onClick={openBulkAttendanceModal} size="sm">
                  Mark Attendance
                </Button>
                <button
                  type="button"
                  onClick={() => setSelectedBulkEmployees([])}
                  className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                >
                  <IoClose size={18} />
                </button>
              </div>
            )}
            <button
              onClick={() =>
                setCurrentDate((prev) => prev.clone().subtract(1, "month"))
              }
              className="p-2 hover:bg-gray-200 rounded-full"
            >
              &lt;
            </button>
              <button
                onClick={() =>
                  setCurrentDate((prev) => prev.clone().add(1, "month"))
                }
                className="p-2 hover:bg-gray-200 rounded-full"
              >
                &gt;
              </button>
          </div>
        </div>

        <div className="max-h-[calc(100vh-250px)] overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="sticky left-0 top-0 z-40 min-w-[220px] bg-gray-50 p-4 text-left font-semibold text-gray-700 shadow-[1px_0_0_#e5e7eb]">
                  Employee
                </th>
                {tableHeaderData?.map((day) => (
                  <th
                    key={day.number}
                    className={`sticky top-0 z-30 min-w-[74px] border-b border-gray-200 p-2 text-center font-medium text-gray-600 shadow-[0_1px_0_#e5e7eb] ${
                      day.isPublicHoliday
                        ? "bg-violet-50"
                        : day.isSunday
                          ? "bg-cyan-50"
                          : "bg-gray-50"
                    }`}
                  >
                    <div className="text-[10px] uppercase text-gray-400">
                      {day.isSunday ? "" : day.day}
                    </div>
                    <div className="text-sm font-bold">{day.number}</div>
                    {day.isPublicHoliday && (
                      <div className="mx-auto mt-1 max-w-[64px] truncate rounded bg-violet-600 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-white">
                        {day?.holidayData?.name}
                      </div>
                    )}
                    {!day.isPublicHoliday && day.isSunday && (
                      <div className="mx-auto mt-1 rounded bg-cyan-600 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-white">
                        Sunday
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData?.map((employee) => (
                <tr
                  key={employee.id}
                  className="group border-b border-gray-100 transition-colors hover:bg-gray-50"
                >
                  <td
                    onClick={() => toggleBulkEmployee(employee)}
                    className={`sticky left-0 z-20 min-w-[220px] cursor-pointer p-4 shadow-[1px_0_0_#e5e7eb] transition-colors ${
                      isBulkEmployeeSelected(employee.id)
                        ? "bg-gray-900 text-white group-hover:bg-gray-900"
                        : "bg-white group-hover:bg-gray-50"
                    }`}
                  >
                    <div>
                      <div
                        className={`font-semibold ${
                          isBulkEmployeeSelected(employee.id)
                            ? "text-white"
                            : "text-gray-800"
                        }`}
                      >
                        {employee.name}
                      </div>
                      <div
                        className={`text-xs ${
                          isBulkEmployeeSelected(employee.id)
                            ? "text-gray-200"
                            : "text-gray-500"
                        }`}
                      >
                        {employee.designation}
                      </div>
                    </div>
                  </td>
                  {tableHeaderData.map((day) => {
                    const { date, isSunday, isPublicHoliday, number } = day;
                    const record = employee?.attendanceRecords?.find(
                      (attendanceRecord) =>
                        moment(attendanceRecord.date).isSame(date, "day"),
                    );
                    const status = record?.status || (isSunday ? "leave" : "");
                    const overtime_hours = record?.overtime_hours || 0;
                    const statusClass =
                      status === "present"
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : status === "absent"
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : isSunday
                            ? "bg-cyan-100 text-cyan-700 border border-cyan-200"
                            : status === "leave"
                              ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                              : "bg-gray-100 text-gray-400 border border-gray-200";

                    return (
                      <td
                        key={number}
                        className={`cursor-pointer p-2 text-center transition-colors ${
                          isSunday
                            ? "bg-cyan-50 hover:bg-cyan-100"
                            : isPublicHoliday
                              ? "bg-violet-50  hover:bg-violet-100 "
                              : "hover:bg-gray-100"
                        }`}
                        onClick={() => handleCellClick(employee, day, record)}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold ${statusClass}`}
                          >
                            {status ? status?.charAt(0).toUpperCase() : ".."}
                          </div>
                          {status === "present" && overtime_hours > 0 && (
                            <div className="text-[10px] text-gray-500">
                              <span className="block">OT Hrs</span>
                              <div className="w-10 text-center border border-gray-200 rounded bg-white">
                                {overtime_hours}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MARK ATTENDANCE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-[95%] max-w-lg overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-200 bg-gray-50 p-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Mark Attendance
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedCell?.employee.name} -{" "}
                  {moment(selectedCell?.day.date).format("DD MMM YYYY ddd")}
                </p>
                {selectedCell?.day?.isPublicHoliday && (
                  <span className="mt-3 inline-flex rounded bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-700">
                    Public holiday: {selectedCell?.day?.holidayData?.name}
                  </span>
                )}
                {!selectedCell?.day?.isPublicHoliday &&
                  selectedCell?.day.isSunday && (
                    <span className="mt-3 inline-flex rounded bg-cyan-100 px-2 py-1 text-xs font-semibold text-cyan-700">
                      Weekly holiday: Sunday
                    </span>
                  )}
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-800"
              >
                <IoClose size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-6 p-5">
              {/* Status Selection */}
              <div>
                <label className="mb-3 block text-sm font-semibold text-gray-700">
                  Attendance Status
                </label>
                <div className="flex gap-2">
                  {ATTENDANCE_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setFormData({ ...formData, status: s })}
                      className={`flex-1 rounded-md border px-3 py-2.5 text-sm font-semibold transition-all 
                        ${
                          formData.status === s
                            ? s === "present"
                              ? "border-green-600 bg-green-600 text-white"
                              : s === "absent"
                                ? "border-red-600 bg-red-600 text-white"
                                : "border-yellow-500 bg-yellow-500 text-white"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                      {s ? s.charAt(0).toUpperCase() + s.slice(1) : ""}
                    </button>
                  ))}
                </div>
              </div>

              {formData.status === "present" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Check-in Time
                      </label>
                      <input
                        type="datetime-local"
                        name="check_in"
                        value={formData.check_in}
                        onChange={handleChange}
                        className="w-full rounded-md cursor-pointer border border-gray-300 p-3 font-medium transition-all focus:border-gray-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Check-out Time
                      </label>
                      <input
                        type="datetime-local"
                        name="check_out"
                        value={formData.check_out}
                        onChange={handleChange}
                        className="w-full rounded-md border cursor-pointer border-gray-300 p-3 font-medium transition-all focus:border-gray-700 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-4">
                    <div>
                      <p className="font-semibold text-gray-800">Overtime</p>
                      <p className="text-xs text-gray-500">
                        Standard shift: 12 Hours
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-gray-900">
                        {formData.overtime_hours}
                      </span>
                      <span className="ml-1 text-sm font-semibold text-gray-600">
                        Hrs
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Note
                </label>
                <input
                  type="text"
                  name="note"
                  placeholder="Enter note"
                  value={formData.note}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 p-3 font-medium transition-all focus:border-gray-700 focus:outline-none"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button onClick={() => setIsModalOpen(false)} variant="danger" size="lg">
                   Cancel
                </Button>
                <Button onClick={saveAttendance} loading={updateAttendanceLoading} className="ml-4" size="lg">
                   Update
                </Button>
               
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BULK MARK ATTENDANCE MODAL */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-[96%] max-w-5xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 bg-gray-50 p-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Mark Attendance
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedBulkEmployees.length} employees selected
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                    Attendance Date
                  </label>
                  <input
                    type="date"
                    value={bulkDate}
                    min={currentDate.clone().startOf("month").format("YYYY-MM-DD")}
                    max={currentDate.clone().endOf("month").format("YYYY-MM-DD")}
                    onChange={handleBulkDateChange}
                    className="rounded-md border border-gray-300 p-2.5 text-sm font-semibold text-gray-800 focus:border-gray-700 focus:outline-none"
                  />
                </div>
                <button
                  onClick={closeBulkAttendanceModal}
                  className="mt-5 rounded p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-800"
                >
                  <IoClose size={24} />
                </button>
              </div>
              {(getDateMeta(bulkDate).isSunday ||
                getDateMeta(bulkDate).isPublicHoliday) && (
                <div className="w-full">
                  {getDateMeta(bulkDate).isPublicHoliday ? (
                    <span className="inline-flex rounded bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-700">
                      Public holiday: {getDateMeta(bulkDate)?.holidayData?.name}
                    </span>
                  ) : (
                    <span className="inline-flex rounded bg-cyan-100 px-2 py-1 text-xs font-semibold text-cyan-700">
                      Weekly holiday: Sunday
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="max-h-[65vh] space-y-4 overflow-y-auto p-5">
              {selectedBulkEmployees.map((employee) => {
                const employeeForm = bulkForms[employee.id];
                if (!employeeForm) return null;

                return (
                  <div
                    key={employee.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {employee.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {employee.designation || "--"}
                        </p>
                      </div>
                      <div className="flex min-w-[260px] gap-2">
                        {ATTENDANCE_STATUSES.map((status) => (
                          <button
                            key={`${employee.id}-${status}`}
                            type="button"
                            onClick={() =>
                              handleBulkFormChange(employee.id, {
                                target: { name: "status", value: status },
                              })
                            }
                            className={`flex-1 rounded-md border px-3 py-2 text-sm font-semibold transition-all ${
                              employeeForm.status === status
                                ? status === "present"
                                  ? "border-green-600 bg-green-600 text-white"
                                  : status === "absent"
                                    ? "border-red-600 bg-red-600 text-white"
                                    : "border-yellow-500 bg-yellow-500 text-white"
                                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {employeeForm.status === "present" && (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                            Check-in Time
                          </label>
                          <input
                            type="datetime-local"
                            name="check_in"
                            value={employeeForm.check_in}
                            onChange={(e) => handleBulkFormChange(employee.id, e)}
                            className="w-full rounded-md border border-gray-300 p-3 font-medium transition-all focus:border-gray-700 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                            Check-out Time
                          </label>
                          <input
                            type="datetime-local"
                            name="check_out"
                            value={employeeForm.check_out}
                            onChange={(e) => handleBulkFormChange(employee.id, e)}
                            className="w-full rounded-md border border-gray-300 p-3 font-medium transition-all focus:border-gray-700 focus:outline-none"
                          />
                        </div>
                        <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs font-bold uppercase text-gray-500">
                            Overtime
                          </p>
                          <div className="mt-1">
                            <span className="text-2xl font-bold text-gray-900">
                              {employeeForm.overtime_hours}
                            </span>
                            <span className="ml-1 text-sm font-semibold text-gray-600">
                              Hrs
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                        Note
                      </label>
                      <input
                        type="text"
                        name="note"
                        placeholder="Enter note"
                        value={employeeForm.note}
                        onChange={(e) => handleBulkFormChange(employee.id, e)}
                        className="w-full rounded-md border border-gray-300 p-3 font-medium transition-all focus:border-gray-700 focus:outline-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 p-5">
              <Button onClick={closeBulkAttendanceModal} variant="danger" size="lg">
                Cancel
              </Button>
              <Button
                onClick={saveBulkAttendance}
                loading={updateAttendanceLoading}
                size="lg"
              >
                Update Attendance
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
