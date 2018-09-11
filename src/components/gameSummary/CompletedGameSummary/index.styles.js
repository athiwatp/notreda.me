import styled from 'styled-components';

export const CompletedGameWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`;

export const LinescoreMetadataWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-bottom: 36px;

  @media (max-width: 1000px) {
    flex-direction: column;
  }
`;
