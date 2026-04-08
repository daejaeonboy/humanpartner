import React from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { ko } from "date-fns/locale/ko";
import "react-datepicker/dist/react-datepicker.css";
import "../../src/styles/calendar.css";

registerLocale("ko", ko);

interface InlineDateRangePickerProps {
  selected: Date | null;
  onChange: (dates: [Date | null, Date | null]) => void;
  startDate: Date | null;
  endDate: Date | null;
  minDate?: Date;
  monthsShown?: number;
  dateFormat?: string;
  locale?: string;
}

const InlineDateRangePicker: React.FC<InlineDateRangePickerProps> = ({
  selected,
  onChange,
  startDate,
  endDate,
  minDate = new Date(),
  monthsShown = 1,
  dateFormat = "yyyy.MM.dd",
  locale = "ko",
}) => {
  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      startDate={startDate}
      endDate={endDate}
      selectsRange
      inline
      minDate={minDate}
      monthsShown={monthsShown}
      dateFormat={dateFormat}
      locale={locale}
    />
  );
};

export default InlineDateRangePicker;
