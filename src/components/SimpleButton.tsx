import React from 'react';

interface SimpleButtonProps {
	label: string;
	onClick?: () => void;
}

// 提供一个简单的内部点击计数，方便验证组件已正确挂载
const SimpleButton: React.FC<SimpleButtonProps> = ({ label, onClick }) => {
	const [count, setCount] = React.useState(0);
	const handleClick = () => {
		setCount(c => c + 1);
		if (onClick) {
			onClick();
		} else {
			// 默认行为：弹出提示，说明按钮已工作；如果宿主提供 Notice（Obsidian），则使用之
			const W: any = window as any;
			if (W.Notice) {
				try { new W.Notice(`${label} clicked (${count + 1})`); } catch { /* ignore */ }
			} else {
				alert(`${label} clicked (${count + 1})`);
			}
		}
	};
	return (
		<button onClick={handleClick} style={{ padding: '8px 16px', fontSize: '14px', cursor: 'pointer' }}>
			{label} {count > 0 && <span style={{ opacity: 0.7 }}>({count})</span>}
		</button>
	);
};

export default SimpleButton;
