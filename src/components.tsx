import styled from "styled-components";

export const Input = styled.input`
  border-radius: 16px;
  width: 100%;
  font-size: 2rem;
  padding: 8px;
`;

export const Button = styled.button`
  border-radius: 16px;
  padding: 12px;
  font-size: 2rem;
  margin: 8px;
  width: calc(100% - 24px);
`;

export const Text = styled.p`
  font-size: 1rem;
  padding: 1rem 0.5rem;
  margin: 0;
`;

export const ScooterOption = styled.button<{ selected?: boolean }>`
  font-size: 1.2rem;
  padding: 32px;
  margin: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 16px;
  width: calc(100% - 24px);
  border: 2px solid ${(prop) => (prop.selected ? "green" : "black")};
`;

export const Loading = () => (
  <Backdrop>
    <Loader />
  </Backdrop>
);

const Backdrop = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background: #0007;
  height: 100%;
  width: 100%;
`;

const Loader = styled.span`
  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  width: 48px;
  height: 48px;
  border: 5px solid #fff;
  border-bottom-color: transparent;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
`;
