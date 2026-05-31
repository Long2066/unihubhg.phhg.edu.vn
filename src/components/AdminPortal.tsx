import React, { useState } from "react";
import { useUniHub } from "../state";
import { 
  Settings, 
  Trash2, 
  MapPin, 
  Sliders, 
  Lock, 
  CheckCircle, 
  Clock, 
  RotateCcw, 
  Grid, 
  UserSquare2, 
  ShieldAlert,
  Edit,
  SlidersHorizontal,
  Info,
  FileText,
  Download,
  UploadCloud,
  X,
  Check,
  AlertTriangle
} from "lucide-react";

export const AdminPortal: React.FC = () => {
  const { 
    period, 
    criteria, 
    results, 
    updateCriteriaScore, 
    bulkUpdateCriteria,
    updatePeriodStatus, 
    resetToSeeds, 
    students,
    organizations 
  } = useUniHub();

  const [activeTab, setActiveTab] = useState<"CONFIG" | "PERIOD" | "STATIONS">("CONFIG");

  // Edit point value local state
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [parentCriteriaId, setParentCriteriaId] = useState<string>("");
  const [editPoints, setEditPoints] = useState(0);

  // Word Import/Export state variables
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [pasteHtmlData, setPasteHtmlData] = useState("");
  const [parsedChanges, setParsedChanges] = useState<{
    criteriaId: string;
    ruleId: string;
    oldName: string;
    newName: string;
    oldPoints: number;
    newPoints: number;
    hasDiff: boolean;
  }[]>([]);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [isSuccessfullyParsed, setIsSuccessfullyParsed] = useState(false);

  const startRulePointsEdit = (critId: string, ruleId: string, currentPoints: number) => {
    setParentCriteriaId(critId);
    setSelectedRuleId(ruleId);
    setEditPoints(currentPoints);
  };

  const saveRulePoints = () => {
    if (selectedRuleId && parentCriteriaId) {
      updateCriteriaScore(parentCriteriaId, selectedRuleId, Number(editPoints));
      setSelectedRuleId(null);
      alert("Đã cập nhật quy chế chấm điểm rèn luyện tự động của phân hiệu thành công! Thang điểm mới lập tức áp dụng.");
    }
  };

  // Dynamically load PDF.js CDN for client-side PDF text extraction
  const loadPdfJs = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => {
        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(pdfjsLib);
      };
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const pdfjsLib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join("\n");
      fullText += pageText + "\n";
    }
    return fullText;
  };

  // Parser of pasted table from Microsoft Word or plain text
  const parseImportContent = (rawText: string, rawHtml?: string) => {
    setParsingError(null);
    setIsSuccessfullyParsed(false);
    
    const currentRulesMap: { [key: string]: { parentId: string; name: string; points: number } } = {};
    criteria.forEach(crit => {
      crit.rules.forEach(rule => {
        currentRulesMap[rule.id] = {
          parentId: crit.id,
          name: rule.name,
          points: rule.points
        };
      });
    });

    const parsedLogsMap = new Map<string, { newName: string; newPoints: number }>();

    // 1. Core Table parser if pasted as Rich structured HTML from MS Word Document
    if (rawHtml) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHtml, "text/html");
      const rows = doc.querySelectorAll("tr");
      
      if (rows && rows.length > 0) {
        rows.forEach(row => {
          const cells = Array.from(row.querySelectorAll("td, th"));
          if (cells.length >= 2) {
            let ruleId = "";
            let ruleIdCellIndex = -1;
            
            cells.forEach((cell, idx) => {
              const txt = cell.textContent?.trim() || "";
              const match = txt.match(/^TC([1-5])\.([1-5])$/);
              if (match) {
                ruleId = match[0];
                ruleIdCellIndex = idx;
              }
            });

            if (ruleId && currentRulesMap[ruleId]) {
              let matchedName = "";
              let matchedPoints: number | null = null;

              cells.forEach((cell, idx) => {
                if (idx === ruleIdCellIndex) return;
                const cellTxt = cell.textContent?.trim() || "";
                if (!cellTxt) return;
                
                // Keep the longest non-numeric text block as candidate for description
                const parsedNum = parseInt(cellTxt.replace(/[^\d+-]/g, ""), 10);

                if (!isNaN(parsedNum) && (cellTxt.match(/^[+-]?\d+/) || cellTxt.includes("điểm") || cellTxt.includes("đ"))) {
                  matchedPoints = parsedNum;
                } else if (cellTxt.length > 5 && cellTxt.length > matchedName.length) {
                  matchedName = cellTxt;
                }
              });

              if (matchedPoints !== null) {
                parsedLogsMap.set(ruleId, {
                  newName: matchedName || currentRulesMap[ruleId].name,
                  newPoints: matchedPoints
                });
              }
            }
          }
        });
      }
    }

    // 2. Intelligent general parser (supporting both tab-splits and multi-line wrapping in PDF extraction)
    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/\b(TC[1-5]\.[1-5])\b/);
      if (!match) continue;
      
      const ruleId = match[1];
      const ruleConfig = currentRulesMap[ruleId];
      if (!ruleConfig) continue;
      
      let candidatePoints: number | null = null;
      let candidateName = "";

      // Check if tab-separated line
      if (line.includes("\t")) {
        const parts = line.split("\t");
        let ruleIdIdx = -1;
        parts.forEach((p, idx) => {
          if (p.trim() === ruleId) ruleIdIdx = idx;
        });

        parts.forEach((part, idx) => {
          if (idx === ruleIdIdx) return;
          const partTxt = part.trim();
          if (!partTxt) return;
          
          const parsedNum = parseInt(partTxt.replace(/[^\d+-]/g, ""), 10);
          if (!isNaN(parsedNum) && (partTxt.match(/^[+-]?\d+/) || partTxt.includes("điểm") || partTxt.includes("đ"))) {
            candidatePoints = parsedNum;
          } else if (partTxt.length > 5 && partTxt.length > candidateName.length) {
            candidateName = partTxt;
          }
        });
      } else {
        // Look inside the line first (inline)
        const lineWithoutId = line.replace(ruleId, "").trim();
        const ptMatch = lineWithoutId.match(/([+-]?\d+)\s*(điểm|đ|pts|points)\b/i) || 
                        lineWithoutId.match(/\b([+-]?\d+)\s*$/) ||
                        lineWithoutId.match(/^[+-]?\d+/);
        
        if (ptMatch) {
          const num = parseInt(ptMatch[1], 10);
          if (!isNaN(num)) {
            candidatePoints = num;
            const textWithoutPoints = lineWithoutId.replace(ptMatch[0], "").trim();
            candidateName = textWithoutPoints.replace(/^[|:-\s\t]+|[|:-\s\t]+$/g, "").trim();
          }
        }
      }

      // If we still miss name or points, look forward up to 5 lines (critical for PDF wrapped cells)
      if (candidatePoints === null || candidateName.length < 5) {
        for (let j = 1; j <= 5; j++) {
          if (i + j >= lines.length) break;
          const nextLine = lines[i + j];
          
          // Stop if another ID starts
          if (nextLine.match(/\b(TC[1-5]\.[1-5])\b/)) {
            break;
          }
          
          const isScoreOnly = nextLine.match(/^([+-]?\d+)\s*(điểm|đ|pts|points)?$/i);
          if (isScoreOnly && candidatePoints === null) {
            const num = parseInt(isScoreOnly[1], 10);
            if (!isNaN(num)) {
              candidatePoints = num;
              continue;
            }
          }
          
          const upperNext = nextLine.toUpperCase();
          if (upperNext !== "GPA" && upperNext !== "MANUAL" && upperNext !== "EXCEPTION" && nextLine.length > 4) {
            if (nextLine.length > candidateName.length) {
              candidateName = nextLine;
            }
          }
        }
      }

      // Populate if found
      if (candidatePoints !== null) {
        parsedLogsMap.set(ruleId, {
          newName: candidateName || currentRulesMap[ruleId].name,
          newPoints: candidatePoints
        });
      }
    }

    const collectedChanges: {
      criteriaId: string;
      ruleId: string;
      oldName: string;
      newName: string;
      oldPoints: number;
      newPoints: number;
      hasDiff: boolean;
    }[] = [];

    parsedLogsMap.forEach((val, rId) => {
      const orig = currentRulesMap[rId];
      if (orig) {
        const hasDiff = orig.name !== val.newName || orig.points !== val.newPoints;
        collectedChanges.push({
          criteriaId: orig.parentId,
          ruleId: rId,
          oldName: orig.name,
          newName: val.newName,
          oldPoints: orig.points,
          newPoints: val.newPoints,
          hasDiff
        });
      }
    });

    if (collectedChanges.length === 0) {
      setParsingError("Hệ thống chưa nhận diện được cấu trúc quy chế hợp lệ nào. Thầy/Cô lưu ý bôi đen & copy nguyên bảng biểu có cột chứa mã như TC1.1, TC1.2 rồi dán (Paste) vào nhé!");
      setIsSuccessfullyParsed(false);
      setParsedChanges([]);
    } else {
      setParsedChanges(collectedChanges);
      setIsSuccessfullyParsed(true);
      setParsingError(null);
    }
  };

  const handlePasteEvent = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    setImportText(text);
    if (html) {
      setPasteHtmlData(html);
      parseImportContent(text, html);
    } else {
      setPasteHtmlData("");
      parseImportContent(text);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith(".pdf")) {
      setParsingError("Đang khởi chạy thuật toán bóc tách PDF thông minh...");
      setIsSuccessfullyParsed(false);
      try {
        const text = await extractTextFromPdf(file);
        setImportText(text);
        setPasteHtmlData("");
        parseImportContent(text);
      } catch (err: any) {
        setParsingError("Lỗi bóc tách PDF: " + err.message + ". Quý Thầy/Cô có thể copy và dán trực tiếp nội dung dạng văn bản vào ô dán bên trái.");
      }
    } else if (file.name.endsWith(".doc") || file.name.endsWith(".html") || file.name.endsWith(".htm") || file.name.endsWith(".docx")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text.includes("<html") || text.includes("<body") || text.includes("xmlns:w=")) {
          setImportText(`[Đã tải thành công tệp hành chính mẫu: ${file.name}]\n\nUniHub đã đồng bộ toàn diện từng cột trong bảng biểu rèn luyện! Quý Thầy/Cô vui lòng duyệt kết quả khớp lệch ở cột bên phải.`);
          setPasteHtmlData(text);
          parseImportContent(text, text);
        } else {
          if (file.name.endsWith(".docx")) {
            alert(`Tệp "${file.name}" ở định dạng Word nhị phân (.docx).\n\nHướng dẫn cập nhật tối ưu nhất:\n1. Mở tệp trong Word hoặc Google Docs.\n2. Nhấn Ctrl+A rồi chọn Copy (Ctrl+C).\n3. Quay lại UniHub, chọn vùng dán và bấm phím tắt Ctrl+V.\nBản ghi HTML-Word nguyên bản giữ nguyên thiết kế chuẩn sẽ đồng bộ hoàn hảo!`);
          } else {
            setImportText(text);
            setPasteHtmlData("");
            parseImportContent(text);
          }
        }
      };
      reader.readAsText(file);
    } else if (file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setImportText(text);
        setPasteHtmlData("");
        parseImportContent(text);
      };
      reader.readAsText(file);
    } else {
      alert("Hệ thống chỉ hỗ trợ nạp từ tệp: .doc (Bản Word liên thông mẫu), .pdf (Bản in PDF) hoặc .txt.");
    }
  };

  const handleConfirmImport = () => {
    if (parsedChanges.length === 0) return;

    const updatedCriteria = criteria.map(crit => {
      const updatedRules = crit.rules.map(rule => {
        const change = parsedChanges.find(c => c.ruleId === rule.id);
        if (change) {
          return {
            ...rule,
            name: change.newName || rule.name,
            points: change.newPoints
          };
        }
        return rule;
      });

      return {
        ...crit,
        rules: updatedRules
      };
    });

    bulkUpdateCriteria(updatedCriteria);
    setShowImportModal(false);
    setIsSuccessfullyParsed(false);
    setParsedChanges([]);
    setImportText("");
    setPasteHtmlData("");
    alert("Cập nhật đồng bộ thành công! Thang điểm rèn luyện mới đã được lưu chính thức trong hệ thống rèn luyện của toàn phân hiệu.");
  };

  // Export fully built MS Word Document (.doc) loaded with beautiful styles
  const handleExportToWord = () => {
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <title>Quy chế Chấm điểm Rèn luyện Phân hiệu Hà Giang</title>
      <meta charset='utf-8'>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page {
          size: A4;
          margin: 1.0in 0.75in 1.0in 0.75in;
        }
        body { 
          font-family: 'Times New Roman', Times, serif; 
          font-size: 11.5pt; 
          line-height: 1.55; 
          color: #111827; 
          margin: 0; 
        }
        .school-title { 
          font-size: 11pt; 
          font-weight: bold; 
          text-transform: uppercase; 
          color: #000000; 
          line-height: 1.3; 
        }
        .country-title { 
          font-size: 11pt; 
          font-weight: bold; 
          text-transform: uppercase; 
          color: #000000; 
          line-height: 1.3; 
        }
        .country-desc { 
          font-size: 12pt; 
          font-weight: bold; 
          color: #000000; 
          line-height: 1.3; 
        }
        h1 { 
          text-align: center; 
          font-size: 14.5pt; 
          font-weight: bold; 
          margin-top: 25px; 
          margin-bottom: 4px; 
          color: #1e3a8a; 
          text-transform: uppercase; 
          line-height: 1.3;
        }
        h2 { 
          text-align: center; 
          font-size: 12.5pt; 
          font-weight: bold; 
          margin-top: 0px;
          margin-bottom: 25px; 
          color: #1e293b; 
          line-height: 1.3;
        }
        .meta-info { 
          margin-top: -15px;
          margin-bottom: 30px; 
          font-style: italic; 
          text-align: center; 
          font-size: 10.5pt; 
          color: #475569; 
        }
        .instruction-box-table {
          width: 100%; 
          border-collapse: collapse; 
          background-color: #f8fafc; 
          border: 1.5px solid #cbd5e1; 
          margin-bottom: 30px;
        }
        .instruction-title { 
          font-weight: bold; 
          font-size: 11pt; 
          color: #1e3a8a; 
          margin-bottom: 6px; 
          text-transform: uppercase;
        }
        .instruction-text { 
          font-size: 10pt; 
          color: #334155; 
          margin: 0; 
          line-height: 1.5; 
        }
        table.rules-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 25px; 
          border: 1px solid #94a3b8;
        }
        table.rules-table th { 
          background-color: #f1f5f9; 
          border: 1px solid #94a3b8; 
          padding: 10px 8px; 
          font-weight: bold; 
          font-size: 10.5pt; 
          text-align: center; 
          color: #0f172a; 
        }
        table.rules-table td { 
          border: 1px solid #cbd5e1; 
          padding: 9px 8px; 
          font-size: 10.5pt; 
          vertical-align: middle; 
          color: #1f2937;
        }
        .points-positive { 
          font-weight: bold; 
          color: #15803d; 
          text-align: center; 
          font-size: 11pt;
        }
        .points-negative { 
          font-weight: bold; 
          color: #b91c1c; 
          text-align: center; 
          font-size: 11pt;
        }
        .points-neutral { 
          font-weight: bold; 
          color: #1e3a8a; 
          text-align: center; 
          font-size: 11pt;
        }
        .footer-note { 
          text-align: center; 
          margin-top: 60px; 
          font-size: 9.5pt; 
          color: #64748b; 
          border-top: 1.5px solid #cbd5e1; 
          padding-top: 15px; 
          line-height: 1.4;
        }
      </style>
    </head>
    <body>
      
      <!-- Administrative Header Table -->
      <table border="0" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 25px;">
        <tr>
          <td style="width: 45%; text-align: center; vertical-align: top; border: none; padding: 0;">
            <div class="school-title">ĐẠI HỌC THÁI NGUYÊN</div>
            <div class="school-title" style="margin-top: 3px;">PHÂN HIỆU TẠI TỈNH HÀ GIANG</div>
            <div style="font-weight: bold; color: #000000; margin-top: 4px; font-size: 11pt; text-align: center;">---------------</div>
          </td>
          <td style="width: 55%; text-align: center; vertical-align: top; border: none; padding: 0;">
            <div class="country-title">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div class="country-desc" style="margin-top: 3px;">Độc lập - Tự do - Hạnh phúc</div>
            <div style="font-weight: bold; color: #000000; margin-top: 4px; font-size: 11pt; text-align: center;">-----------------------</div>
            <div style="font-size: 10.5pt; font-style: italic; color: #475569; text-align: center; margin-top: 8px;">
              Hà Giang, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}
            </div>
          </td>
        </tr>
      </table>
      
      <h1>QUY CHẾ TIÊU CHÍ VÀ THANG ĐIỂM CHẤM ĐIỂM RÈN LUYỆN</h1>
      <h2>ÁP DỤNG: HỌC KỲ II - NĂM HỌC ${period.academicYear}</h2>

      <div class="meta-info">
        Hệ thống liên thông điện tử UniHub Rèn Luyện Sinh Viên<br/>
        Trích xuất dữ liệu phòng Công tác Học sinh Sinh viên (CTHSSV)
      </div>

      <!-- Quick Guidance Table -->
      <table border="0" cellspacing="0" cellpadding="0" class="instruction-box-table">
        <tr>
          <td style="padding: 14px; border: none; background-color: #f8fafc;">
            <div class="instruction-title">HƯỚNG DẪN CẬP NHẬT / THAY ĐỔI THANG ĐIỂM VÀO UNIHUB:</div>
            <p class="instruction-text" style="margin-bottom: 6px;">
              1. Quý Thầy/Cô và Admin Phòng CTHSSV có thể trực tiếp sửa nội dung cột <strong>"Nội dung quy chế chi tiết"</strong> và điểm số tại cột <strong>"Điểm định mức"</strong> ngay trong văn bản Word này.
            </p>
            <p class="instruction-text" style="margin-bottom: 6px;">
              2. <strong>Yêu cầu bắt buộc:</strong> Giữ nguyên hoàn toàn các mã ở cột <strong>"Mã quy chế"</strong> (Ví dụ: <span style="font-family: monospace; font-weight: bold; color: #b45309;">TC1.1</span>, <span style="font-family: monospace; font-weight: bold; color: #b45309;">TC3.2</span>...). Đây là chìa khóa định danh kỹ thuật để hệ thống UniHub tự động khớp vị trí quy tắc ban đầu.
            </p>
            <p class="instruction-text">
              3. <strong>Cách đồng bộ:</strong> Sau khi cập nhật xong chỉ cần ấn phím tắt <kbd style="background: #ffffff; border: 1px solid #ccc; padding: 1px 3px; font-size: 8.5pt;">Ctrl+A</kbd> để bôi đen, chọn Copy (<kbd style="background: #ffffff; border: 1px solid #ccc; padding: 1px 3px; font-size: 8.5pt;">Ctrl+C</kbd>). Quay lại UniHub, nhấp vào nút <strong>"Nhập từ Word"</strong> và thực hiện dán (<kbd style="background: #ffffff; border: 1px solid #ccc; padding: 1px 3px; font-size: 8.5pt;">Ctrl+V</kbd>) để hệ thống tự động ghi nhận quy chế mới.
            </p>
          </td>
        </tr>
      </table>`;

    let content = "";
    criteria.forEach(crit => {
      content += `
      <!-- Section criteria title banner -->
      <table border="0" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; margin-top: 25px; margin-bottom: 0; background-color: #1a365d;">
        <tr>
          <td style="background-color: #1e3a8a; padding: 10px 14px; border: 1px solid #1e3a8a;">
            <span style="font-size: 11.5pt; font-weight: bold; color: #ffffff; text-transform: uppercase; font-family: 'Times New Roman', Times, serif;">
              MỤC ${crit.id}: ${crit.category.toUpperCase()} (TỐI ĐA ${crit.maxScore} ĐIỂM)
            </span>
          </td>
        </tr>
      </table>
      <div style="font-size: 10pt; color: #475569; font-style: italic; margin-top: 5px; margin-bottom: 12px; font-family: 'Times New Roman', Times, serif;">
        <strong>Mô tả:</strong> ${crit.description}
      </div>

      <!-- Rules list table -->
      <table class="rules-table" border="1" cellspacing="0" cellpadding="8">
        <thead>
          <tr>
            <th style="width: 15%; text-align: center;">Mã quy chế</th>
            <th style="width: 57%; text-align: left;">Nội dung quy chế chi tiết (Thành tích hoặc Vi phạm)</th>
            <th style="width: 14%; text-align: center;">Điểm định mức</th>
            <th style="width: 14%; text-align: center;">Phân loại</th>
          </tr>
        </thead>
        <tbody>`;
      
      crit.rules.forEach(rule => {
        let ptsStyleClass = "points-neutral";
        if (rule.points > 0) {
          ptsStyleClass = "points-positive";
        } else if (rule.points < 0) {
          ptsStyleClass = "points-negative";
        }

        const formattedPoints = rule.points > 0 ? `+${rule.points}` : `${rule.points}`;

        content += `<tr>
          <td style="font-weight: bold; text-align: center; font-family: monospace; background-color: #f8fafc; color: #1e3a8a;">${rule.id}</td>
          <td style="line-height: 1.45;">${rule.name}</td>
          <td class="${ptsStyleClass}">${formattedPoints}</td>
          <td style="font-size: 9pt; color: #4b5563; text-align: center; font-weight: bold; text-transform: uppercase;">${rule.type}</td>
        </tr>`;
      });

      content += `</tbody></table><br/>`;
    });

    const footer = `<div class="footer-note">
      VĂN BẢN BIỂU MẪU ĐIỆN TỬ CỦA PHÂN HIỆU ĐẠI HỌC THÁI NGUYÊN TẠI TỈNH HÀ GIANG<br/>
      Đồng bộ chính gốc từ phần mềm liên thông thông minh UniHub - Bảo lưu bản quyền &copy; 2026.<br/>
      <i>Trích xuất điện tử tự động vào ngày ${new Date().toLocaleDateString('vi-VN')} lúc ${new Date().toLocaleTimeString('vi-VN')}</i>
    </div>
    </body></html>`;

    const fullDoc = header + content + footer;
    const blob = new Blob(['\ufeff' + fullDoc], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `UniHub_Quy_Che_Ren_Luyen_Kỳ_II_${period.academicYear}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTogglePeriod = () => {
    const nextStatus = period.status === "ACTIVE" ? "LOCKED" : "ACTIVE";
    updatePeriodStatus(nextStatus);
    alert(`Đã ${nextStatus === "ACTIVE" ? "MỎ LẠI" : "KHÓA QUYẾT TOÁN CỦNG CỐ"} kỳ đánh giá ${period.semester} - Học kỳ II.`);
  };

  const handleResetData = () => {
    if (confirm("Xác nhận đưa cơ sở dữ liệu học kỳ II về trạng thái ban đầu? Tất cả thay đổi demo của bạn sẽ bị xoá.")) {
      resetToSeeds();
      alert("Đã làm sạch và khôi phục cơ sở dữ liệu gốc thành công!");
    }
  };

  return (
    <div className="space-y-6" id="admin-portal-container">
      {/* Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30 uppercase tracking-wider">
            PHÒNG CÔNG TÁC HSSV (AMDIN TỔNG)
          </span>
          <h2 className="text-xl font-extrabold mt-2">Cổng Kiểm Soát Quy Trình Đánh Giá Phân Hiệu Hà Giang</h2>
          <p className="text-xs text-slate-400 mt-1">
            Thiết lập danh mục tiêu chí, điều động mốc thời gian, xử lý cứu xét tối cao và giám sát đồng bộ nề nếp thi đua toàn phân hiệu.
          </p>
        </div>

        <button 
          onClick={handleResetData}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 hover:cursor-pointer text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all shrink-0 shadow-lg shadow-rose-900/15"
        >
          <RotateCcw size={14} />
          <span>Reset Cơ sở dữ liệu gốc</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-row lg:flex-col gap-1.5 overflow-x-auto shrink-0">
          <button 
            onClick={() => setActiveTab("CONFIG")}
            className={`w-full text-left px-3.5 py-3 rounded-lg text-xs font-bold transition-all shrink-0 hover:cursor-pointer flex items-center gap-2 ${activeTab === "CONFIG" ? "bg-slate-900 text-white" : "text-slate-650 hover:bg-slate-50"}`}
          >
            <SlidersHorizontal size={14} />
            <span>Thang điểm quy tắc tự động</span>
          </button>
          <button 
            onClick={() => setActiveTab("PERIOD")}
            className={`w-full text-left px-3.5 py-3 rounded-lg text-xs font-bold transition-all shrink-0 hover:cursor-pointer flex items-center gap-2 ${activeTab === "PERIOD" ? "bg-slate-900 text-white" : "text-slate-650 hover:bg-slate-50"}`}
          >
            <Clock size={14} />
            <span>Cấu hình Kỳ học rèn luyện</span>
          </button>
          <button 
            onClick={() => setActiveTab("STATIONS")}
            className={`w-full text-left px-3.5 py-3 rounded-lg text-xs font-bold transition-all shrink-0 hover:cursor-pointer flex items-center gap-2 ${activeTab === "STATIONS" ? "bg-slate-900 text-white" : "text-slate-650 hover:bg-slate-50"}`}
          >
            <Grid size={14} />
            <span>Giám sát đồng bộ phân hiệu</span>
          </button>
        </div>

        {/* Action Pane Area */}
        <div className="lg:col-span-9 bg-white p-6 rounded-xl border border-slate-100 shadow-sm min-h-[460px] flex flex-col justify-between">
          
          {/* TAB 1: DYNAMIC CRITERIA RULES EDITOR (Section 1.1) */}
          {activeTab === "CONFIG" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase mb-1 font-sans">Sửa quy chế chấm điểm rèn luyện đồng quy</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">Admin có quyền tăng/giảm định mức số điểm quy định cho từng hoạt động, học lực, nề nếp tập thể mà hệ thống tự động ánh xạ, duy trì tính pháp lý của thang điểm 100.</p>
              </div>

              {/* Word Document Import/Export Panel */}
              <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/20 p-4 border border-blue-100 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-blue-100 text-blue-700 rounded text-xs flex items-center justify-center">
                      <FileText size={14} />
                    </span>
                    <h4 className="text-xs font-black text-slate-850">Liên thông Quy chế chấm điểm bằng MS Word (.doc)</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-xl leading-relaxed">
                    Tải đầy đủ khung cơ sở thang điểm hiện tại thành tệp Word, bổ nghĩa hoặc sửa số liệu trực tiếp trong Word, rồi chỉ việc sao chép nạp ngược trở lại đây để đồng bộ toàn phân hiệu tự động hóa!
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    onClick={handleExportToWord}
                    className="px-3 py-2 bg-white text-blue-700 hover:bg-slate-50 text-[11px] font-extrabold border border-blue-200 hover:border-blue-300 rounded-lg flex items-center gap-1.5 transition-all shadow-xs hover:cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Xuất file Word</span>
                  </button>
                  <button
                    onClick={() => {
                      setImportText("");
                      setPasteHtmlData("");
                      setParsedChanges([]);
                      setParsingError(null);
                      setIsSuccessfullyParsed(false);
                      setShowImportModal(true);
                    }}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold rounded-lg flex items-center gap-1.5 transition-all shadow-md hover:cursor-pointer shadow-indigo-600/10"
                  >
                    <UploadCloud size={13} />
                    <span>Nhập từ Word</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {criteria.map(crit => (
                  <div key={crit.id} className="p-4 rounded-xl border border-slate-150 shadow-xs bg-slate-50/20">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                      <div>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-sm font-mono uppercase">Tiêu chí: {crit.id}</span>
                        <h4 className="text-xs font-black text-slate-900 mt-1">{crit.category} (Tối đa: {crit.maxScore}đ)</h4>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono italic">{crit.description}</span>
                    </div>

                    <div className="space-y-2 text-xs font-medium">
                      {crit.rules.map(rule => (
                        <div key={rule.id} className="flex justify-between items-center p-2 rounded bg-white border border-slate-100 hover:border-slate-200 transition-colors">
                          <span className="text-slate-700 p-0.5">{rule.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-slate-850 bg-slate-50 px-2 py-1 border rounded">{rule.points > 0 ? `+${rule.points}` : rule.points} điểm</span>
                            <button 
                              onClick={() => startRulePointsEdit(crit.id, rule.id, rule.points)}
                              className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                            >
                              <Edit size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: GENERAL TERM CONTROL */}
          {activeTab === "PERIOD" && (
            <div className="space-y-4 max-w-lg">
              <div>
                <h3 className="text-sm font-bold text-slate-850 uppercase mb-1">Mốc thời gian và điều phối kì đánh giá</h3>
                <p className="text-[11px] text-slate-450">Khoá sổ chấm điểm sẽ vô hiệu hoá mọi tính năng can thiệp, gửi minh chứng hoặc chốt điểm danh của CLB, bảo vệ tính trung thực của kết quả cuối kỳ.</p>
              </div>

              <div className="p-5 border border-slate-150 rounded-2xl bg-slate-50/50 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Học kỳ hiện tại</span>
                    <strong className="text-xs font-bold text-slate-900 block mt-0.5">{period.semester} - {period.academicYear}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono font-medium text-right">Trạng thái cổng</span>
                    <div className="text-right mt-0.5">
                      <span className={`px-2.5 py-0.5 text-[9px] font-black rounded border inline-block leading-none ${period.status === "ACTIVE" ? 'bg-emerald-5 text-emerald-700 border-emerald-150' : 'bg-rose-5 text-rose-700 border-rose-150'}`}>
                        {period.status === "ACTIVE" ? "ĐANG ĐÁNH GIÁ" : "ĐÃ QUYẾT TOÁN / KHÓA"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-450 font-mono block">Ngày khai mở:</span>
                    <span className="text-slate-750 font-medium font-mono">{period.startDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-450 font-mono block">Ngày đóng cổng:</span>
                    <span className="text-slate-750 font-medium font-mono">{period.endDate}</span>
                  </div>
                </div>

                <div className="pt-3 border-t text-right">
                  <button 
                    onClick={handleTogglePeriod}
                    className={`px-4 py-2 hover:cursor-pointer text-xs font-bold text-white rounded-lg shadow-sm transition-all ${period.status === "ACTIVE" ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
                  >
                    {period.status === "ACTIVE" ? "Khóa cổng quyết toán rèn luyện" : "Mở cổng tự động lại"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SCHOOL-WIDE STATS MONITORING SCREEN */}
          {activeTab === "STATIONS" && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Giám sát tổng thể hoạt động các Phòng/Khoa</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 border rounded-xl bg-white shadow-xs">
                  <span className="text-[10px] text-slate-450 uppercase block font-mono">Sĩ số Phân hiệu</span>
                  <strong className="text-xl font-black text-slate-900 mt-1 block font-mono">{students.length} sinh viên</strong>
                </div>
                <div className="p-4 border rounded-xl bg-white shadow-xs">
                  <span className="text-[10px] text-slate-450 uppercase block font-mono">Tổ chức đăng ký</span>
                  <strong className="text-xl font-black text-slate-900 mt-1 block font-mono">{organizations.length} Câu lạc bộ</strong>
                </div>
                <div className="p-4 border rounded-xl bg-white shadow-xs">
                  <span className="text-[10px] text-slate-450 uppercase block font-mono">Điểm rèn luyện đạt đỉnh</span>
                  <strong className="text-xl font-black text-indigo-600 mt-1 block font-mono">100% tự động</strong>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex gap-3 text-xs leading-relaxed text-slate-550 shadow-xs">
                <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <span>
                  Các cổng liên kết và cơ sở dữ liệu học vụ đồng nhất đảm bảo không phát sinh tranh chấp hoặc tước bỏ nỗ lực rèn văn thể mỹ của sinh viên Phân hiệu Hà Giang.
                </span>
              </div>
            </div>
          )}

          <div className="bg-slate-50 p-3.5 border-t border-slate-100 shrink-0 text-center rounded-b-xl">
            <span className="text-[9px] text-slate-400 font-mono">
              Hệ thống UniHub Rèn Luyện © 2026. Phân hiệu Đại học Thái Nguyên tại tỉnh Hà Giang.
            </span>
          </div>

        </div>

      </div>

      {/* RULE EDIT MODAL */}
      {selectedRuleId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-xs w-full overflow-hidden">
            <div className="flex justify-between items-center bg-slate-50 px-6 py-4 border-b">
              <h3 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <Sliders size={14} />
                <span>Sửa mức điểm quy chế</span>
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Số điểm quy chuẩn (TC{parentCriteriaId.substring(2)})</label>
                <input 
                  type="number"
                  value={editPoints}
                  onChange={(e) => setEditPoints(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border rounded-lg text-xs"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 text-xs font-bold border-t">
                <button 
                  onClick={() => setSelectedRuleId(null)}
                  className="px-3 py-1.5 border hover:bg-slate-50 text-slate-600 rounded-lg cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={saveRulePoints}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg cursor-pointer"
                >
                  Cập nhật
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WORD IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-sans">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center bg-slate-50 px-6 py-4 border-b shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg flex items-center justify-center">
                  <UploadCloud size={18} />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-850 uppercase">Nhập Quy chế rèn luyện từ Microsoft Word</h3>
                  <p className="text-[10px] text-slate-450 font-medium">Bóc tách & so khớp tự động dữ liệu từ clipboard Word giữ nguyên cấu trúc phân hệ</p>
                </div>
              </div>
              <button 
                onClick={() => setShowImportModal(false)}
                className="p-1 px-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                title="Đóng cửa sổ"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Content - Split layout */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[400px]">
              
              {/* Left Column: Instruct & Paste */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="bg-amber-50/40 p-3 rounded-lg border border-amber-100 text-[11px] leading-relaxed text-amber-800">
                    <span className="font-bold block mb-1">Mẹo sao chép chuẩn 100%:</span>
                    Mở tài liệu Word chứa bảng rèn luyện của Phân hiệu, ấn <kbd className="px-1 py-0.5 bg-white border rounded shadow-2xs font-mono text-[9px]">Ctrl+A</kbd> bôi đen, nhấn <kbd className="px-1 py-0.5 bg-white border rounded shadow-2xs font-mono text-[9px]">Ctrl+C</kbd> để copy. Sau đó bấm vào khung bên dưới và ấn <kbd className="px-1 py-0.5 bg-white border rounded shadow-2xs font-mono text-[9px]">Ctrl+V</kbd> để dán.
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Khung dán dữ liệu rèn luyện (Ctrl+V):
                    </label>
                    <textarea
                      onPaste={handlePasteEvent}
                      value={importText}
                      onChange={(e) => {
                        setImportText(e.target.value);
                        parseImportContent(e.target.value);
                      }}
                      placeholder="Chọn vào đây rồi dán (Ctrl+V) bảng biểu rèn luyện đã sao chép từ MS Word hoặc Google Docs vào..."
                      className="w-full h-56 p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-xs font-mono focus:outline-hidden transition-all placeholder:text-slate-400 placeholder:italic placeholder:text-[11px]"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">
                    Hoặc nạp trực tiếp file Word (.doc) / PDF (.pdf) / Văn bản (.txt):
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input 
                      type="file" 
                      accept=".doc,.docx,.pdf,.txt,text/html" 
                      onChange={handleFileUpload}
                      className="hidden" 
                      id="doc-upload-button"
                    />
                    <label 
                      htmlFor="doc-upload-button"
                      className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-indigo-700 rounded-lg text-xs font-extrabold cursor-pointer flex items-center gap-1.5 transition-all w-full justify-center sm:w-auto"
                    >
                      <UploadCloud size={13} />
                      <span>Chọn file từ máy tính (.doc, .pdf, .txt)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column: Parsed Results comparisons */}
              <div className="lg:col-span-7 bg-slate-50/40 border border-slate-150 rounded-xl p-4 flex flex-col min-h-[300px] overflow-hidden">
                <div className="border-b border-slate-100 pb-2 mb-3 flex items-center justify-between shrink-0">
                  <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide">Kết quả bóc tách rèn luyện:</span>
                  {isSuccessfullyParsed && (
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">
                      Đã đồng bộ
                    </span>
                  )}
                </div>

                {/* Body scroll */}
                <div className="flex-1 overflow-y-auto max-h-[360px] text-xs space-y-2 pr-1">
                  {parsingError && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle size={15} />
                        <span>Sai lệch cấu trúc quy chế:</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">{parsingError}</p>
                    </div>
                  )}

                  {!isSuccessfullyParsed && !parsingError && (
                    <div className="h-full flex flex-col justify-center items-center text-slate-350 py-12 text-center space-y-2">
                      <FileText size={42} className="stroke-1 animate-pulse" />
                      <p className="text-[11.5px] font-medium max-w-xs leading-relaxed text-slate-450">
                        Chưa nhận được clipboard. Vui lòng copy bảng quy chế rèn luyện từ MS Word và DÁN vào khung bên trái để bóc tách so sánh thực tế.
                      </p>
                    </div>
                  )}

                  {isSuccessfullyParsed && (
                    <div className="space-y-3">
                      
                      {/* Diff counters */}
                      <div className="p-2.5 bg-yellow-50 text-amber-800 rounded-lg border border-yellow-100 flex items-center justify-between text-[11px] font-bold">
                        <span>Tổng quy định rà quét: {parsedChanges.length}</span>
                        <span>Đã thay đổi định mức: {parsedChanges.filter(c => c.hasDiff).length}</span>
                      </div>

                      {/* Rules comparisons list */}
                      <div className="space-y-2 divide-y divide-slate-100">
                        {parsedChanges.map((change) => (
                          <div 
                            key={change.ruleId} 
                            className={`pt-2 first:pt-0 pb-1 flex flex-col space-y-1 ${change.hasDiff ? 'bg-amber-50/20 -mx-1 px-1 rounded border border-dashed border-amber-200' : ''}`}
                          >
                            <div className="flex justify-between items-center text-[10.5px]">
                              <span className="font-extrabold text-slate-800 font-mono px-1.5 py-0.5 bg-slate-100 rounded text-[9.5px]">
                                Mã quy định: {change.ruleId}
                              </span>
                              {change.hasDiff ? (
                                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded uppercase">
                                  Bị Sửa Đổi
                                </span>
                              ) : (
                                <span className="text-[9px] text-slate-400 font-medium italic">
                                  Không đổi
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-700 font-medium leading-normal">
                              {change.newName}
                            </p>

                            <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-slate-500">
                              <span>Số điểm quy chuẩn:</span>
                              <span className="text-slate-800 line-through">
                                {change.oldPoints > 0 ? `+${change.oldPoints}` : change.oldPoints}đ
                              </span>
                              {change.hasDiff && (
                                <>
                                  <span className="text-indigo-600 font-bold">→</span>
                                  <span className="text-indigo-700 bg-indigo-50 px-1 rounded text-[11px] font-black">
                                    {change.newPoints > 0 ? `+${change.newPoints}` : change.newPoints}đ
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 justify-end px-6 py-4 border-t bg-slate-50 font-bold text-xs shrink-0">
              <button 
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border hover:bg-slate-100 text-slate-600 rounded-xl cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleConfirmImport}
                disabled={!isSuccessfullyParsed || parsedChanges.filter(c => c.hasDiff).length === 0}
                className={`px-4 py-2 text-white rounded-xl flex items-center gap-1.5 transition-all ${
                  isSuccessfullyParsed && parsedChanges.filter(c => c.hasDiff).length > 0
                    ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-md' 
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                <Check size={14} />
                <span>Khoá Cập Nhật Lên Hệ Thống</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
