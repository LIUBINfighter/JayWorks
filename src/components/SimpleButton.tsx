import React from 'react';

interface SimpleButtonProps {
	label: string;
	onClick: () => void;
}

const SimpleButton: React.FC<SimpleButtonProps> = ({ label, onClick }) => {
	return (
		<button onClick={onClick} style={{ padding: '10px 20px', fontSize: '16px' }}>
			{label}
		</button>
	);
};

export default SimpleButton;
