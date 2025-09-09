import React, { useState } from "react";

interface DemoSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  code?: string;
  showCode?: boolean;
}

const DemoSection: React.FC<DemoSectionProps> = ({
  title,
  description,
  children,
  code,
  showCode = false,
}) => {
  const [isCodeVisible, setIsCodeVisible] = useState(showCode);

  return (
    <div className="demo-section">
      <div className="demo-header">
        <h3 className="demo-title">{title}</h3>
        {description && <p className="demo-description">{description}</p>}
      </div>

      <div className="demo-content">{children}</div>

      {code && (
        <div className="demo-code-section">
          <button
            className="btn btn-secondary"
            onClick={() => setIsCodeVisible(!isCodeVisible)}
            style={{ marginBottom: "1rem" }}
          >
            {isCodeVisible ? "隐藏代码" : "显示代码"} 📋
          </button>

          {isCodeVisible && (
            <pre className="demo-code">
              <code>{code}</code>
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default DemoSection;
