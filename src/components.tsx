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
