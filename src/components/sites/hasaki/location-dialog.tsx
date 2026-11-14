"use client";

import { useEffect, useState, useId } from "react";
import { MapPin, X, Check, Zap, Truck, RotateCcw } from "lucide-react";
import {
  VIETNAM_LOCATIONS,
  readLocation,
  saveLocation,
  clearLocation,
  isNowFreeDistrict,
  LOCATION_CHANGE_EVENT,
  type ProvinceLocation,
} from "@/lib/campaigns-location";

interface LocationDialogProps {
  onClose: () => void;
  onSaved?: () => void;
}

export function LocationDialog({ onClose, onSaved }: LocationDialogProps) {
  const titleId = useId();
  const [selectedProvince, setSelectedProvince] = useState<string>(
    () => readLocation()?.province || ""
  );
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    () => readLocation()?.district || ""
  );
  const [selectedWard, setSelectedWard] = useState<string>(
    () => readLocation()?.ward || ""
  );
  const [hasSavedLocation, setHasSavedLocation] = useState<boolean>(
    () => Boolean(readLocation()?.province)
  );
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    function handleLocChange() {
      const current = readLocation();
      if (current && current.province) {
        setSelectedProvince(current.province);
        setSelectedDistrict(current.district || "");
        setSelectedWard(current.ward || "");
        setHasSavedLocation(true);
      }
    }

    window.addEventListener(LOCATION_CHANGE_EVENT, handleLocChange);
    window.addEventListener("storage", handleLocChange);
    return () => {
      window.removeEventListener(LOCATION_CHANGE_EVENT, handleLocChange);
      window.removeEventListener("storage", handleLocChange);
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const currentProvinceData: ProvinceLocation | undefined = VIETNAM_LOCATIONS.find(
    (p) => p.name.toLowerCase() === selectedProvince.toLowerCase()
  );

  const availableDistricts = currentProvinceData ? currentProvinceData.districts : [];

  const currentDistrictData = availableDistricts.find(
    (d) => d.name.toLowerCase() === selectedDistrict.toLowerCase()
  );

  const availableWards = currentDistrictData ? currentDistrictData.wards : [];

  const isNowFree = selectedProvince && selectedDistrict
    ? isNowFreeDistrict(selectedProvince, selectedDistrict)
    : false;

  function handleProvinceChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setSelectedProvince(val);
    setSelectedDistrict("");
    setSelectedWard("");
    setMessage("");
  }

  function handleDistrictChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setSelectedDistrict(val);
    setSelectedWard("");
    setMessage("");
  }

  function handleWardChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedWard(e.target.value);
    setMessage("");
  }

  function handleSave() {
    if (!selectedProvince) {
      setMessage("Vui lòng chọn Tỉnh/Thành phố");
      return;
    }
    if (!selectedDistrict) {
      setMessage("Vui lòng chọn Quận/Huyện");
      return;
    }

    saveLocation({
      province: selectedProvince,
      district: selectedDistrict,
      ward: selectedWard,
    });

    setHasSavedLocation(true);
    setMessage("Đã lưu khu vực thành công!");
    if (onSaved) onSaved();
    setTimeout(() => {
      onClose();
    }, 400);
  }

  function handleClear() {
    clearLocation();
    setSelectedProvince("");
    setSelectedDistrict("");
    setSelectedWard("");
    setHasSavedLocation(false);
    setMessage("Đã xóa khu vực đã chọn.");
    if (onSaved) onSaved();
  }

  return (
    <div
      className="modal-bg"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        className="modal location-dialog-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#ffffff",
          borderRadius: "8px",
          position: "relative",
          padding: "24px 28px",
          maxWidth: "480px",
          width: "100%",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          color: "#333333",
          textAlign: "left",
        }}
      >
        <button
          type="button"
          className="close"
          aria-label="Đóng"
          onClick={onClose}
          style={{
            position: "absolute",
            right: "14px",
            top: "14px",
            border: "none",
            background: "none",
            color: "#666",
            cursor: "pointer",
            padding: "4px",
            borderRadius: "4px",
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "#e8f4ed",
              color: "#326e51",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <MapPin size={20} />
          </div>
          <div>
            <h2
              id={titleId}
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#1e4d36",
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              Chọn khu vực giao hàng
            </h2>
            <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
              Xem chính xác giá, tồn kho và thời gian giao hàng NowFree 2H
            </p>
          </div>
        </div>

        {/* Dropdown 1: Tỉnh / Thành phố */}
        <div style={{ marginBottom: "14px" }}>
          <label
            htmlFor="province-select"
            style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: "#444" }}
          >
            Tỉnh / Thành phố <span style={{ color: "#e85029" }}>*</span>
          </label>
          <select
            id="province-select"
            value={selectedProvince}
            onChange={handleProvinceChange}
            style={{
              width: "100%",
              padding: "9px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              fontSize: "13px",
              backgroundColor: "#fff",
              color: "#111",
              outline: "none",
            }}
          >
            <option value="">-- Chọn Tỉnh / Thành phố --</option>
            {VIETNAM_LOCATIONS.map((province) => (
              <option key={province.code} value={province.name}>
                {province.name}
              </option>
            ))}
          </select>
        </div>

        {/* Dropdown 2: Quận / Huyện */}
        <div style={{ marginBottom: "14px" }}>
          <label
            htmlFor="district-select"
            style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: "#444" }}
          >
            Quận / Huyện <span style={{ color: "#e85029" }}>*</span>
          </label>
          <select
            id="district-select"
            value={selectedDistrict}
            onChange={handleDistrictChange}
            disabled={!selectedProvince}
            style={{
              width: "100%",
              padding: "9px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              fontSize: "13px",
              backgroundColor: selectedProvince ? "#fff" : "#f3f4f6",
              color: selectedProvince ? "#111" : "#9ca3af",
              outline: "none",
            }}
          >
            <option value="">-- Chọn Quận / Huyện --</option>
            {availableDistricts.map((district) => (
              <option key={district.name} value={district.name}>
                {district.name} {district.isNowFreeEligible ? "⚡ (NowFree 2H)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Dropdown 3: Phường / Xã */}
        <div style={{ marginBottom: "16px" }}>
          <label
            htmlFor="ward-select"
            style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: "#444" }}
          >
            Phường / Xã
          </label>
          <select
            id="ward-select"
            value={selectedWard}
            onChange={handleWardChange}
            disabled={!selectedDistrict || availableWards.length === 0}
            style={{
              width: "100%",
              padding: "9px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              fontSize: "13px",
              backgroundColor: selectedDistrict ? "#fff" : "#f3f4f6",
              color: selectedDistrict ? "#111" : "#9ca3af",
              outline: "none",
            }}
          >
            <option value="">-- Chọn Phường / Xã --</option>
            {availableWards.map((ward) => (
              <option key={ward} value={ward}>
                {ward}
              </option>
            ))}
          </select>
        </div>

        {/* NowFree Eligibility Badge */}
        {selectedDistrict && (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: "6px",
              marginBottom: "16px",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: isNowFree ? "#e8f7ee" : "#f3f4f6",
              border: isNowFree ? "1px solid #b7e4c7" : "1px solid #e5e7eb",
              color: isNowFree ? "#1f6e3c" : "#4b5563",
            }}
          >
            {isNowFree ? (
              <>
                <Zap size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Hỗ trợ giao siêu tốc NowFree 2H!</strong> Khu vực này có chi nhánh Hasaki hỗ trợ giao ngay trong 2 giờ.
                </span>
              </>
            ) : (
              <>
                <Truck size={16} color="#6b7280" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Giao hàng tiêu chuẩn:</strong> Đơn hàng sẽ được chuyển phát nhanh từ trung tâm phân phối trong 1 - 3 ngày.
                </span>
              </>
            )}
          </div>
        )}

        {message && (
          <p
            role="status"
            style={{
              fontSize: "12px",
              margin: "0 0 12px",
              color: message.includes("thành công") ? "#16a34a" : "#e85029",
              fontWeight: 500,
            }}
          >
            {message}
          </p>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
          <button
            type="button"
            onClick={handleSave}
            style={{
              flex: 1,
              backgroundColor: "#326e51",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              padding: "10px 16px",
              fontSize: "13px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              cursor: "pointer",
            }}
          >
            <Check size={16} />
            Xác nhận khu vực
          </button>

          {hasSavedLocation && (
            <button
              type="button"
              onClick={handleClear}
              title="Xóa khu vực đã chọn"
              style={{
                backgroundColor: "#f9fafb",
                color: "#6b7280",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                padding: "10px 14px",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                cursor: "pointer",
              }}
            >
              <RotateCcw size={14} />
              Xóa khu vực
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
